/**
 * ========================================
 * Data Source Composable
 * ========================================
 * Fetches and caches remote data for Select, Radio, and SelectBoxes
 * components that define `data.url`, `data.json`, or `data.resource`.
 *
 * Features:
 * - URL fetching with response caching (TTL-based)
 * - Inline JSON parsing
 * - Debounced search/filter parameter support
 * - Loading and error state management
 */

import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import type { SelectValue } from '../types/form'

interface DataSourceOptions {
  /** Remote URL to fetch values from */
  url?: string
  /** Property path on fetch response to extract values */
  valueProperty?: string
  /** Display template, e.g. `<span>{{ item.label }}</span>` */
  template?: string
  /** Inline JSON string or array */
  json?: string | Record<string, unknown>[]
  /** Static values list */
  values?: SelectValue[]
  /** Debounce time for search in ms */
  debounceMs?: number
  /** Cache TTL in ms (default 5 min) */
  cacheTtlMs?: number
  /** Custom headers for fetch */
  headers?: Record<string, string>
}

// ─── Global Cache ──────────────────────────────────────────────
interface CacheEntry {
  data: SelectValue[]
  timestamp: number
}
const cache = new Map<string, CacheEntry>()

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Map raw API response items to SelectValue objects.
 */
function mapToSelectValues(
  items: unknown[],
  valueProperty?: string,
  template?: string,
): SelectValue[] {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: item }
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>

      // Extract value
      const val = valueProperty ? obj[valueProperty] : obj.value ?? obj.id ?? obj._id
      const value = String(val ?? '')

      // Extract label from template or fallback properties
      let label = ''
      if (template) {
        // Simple template: replace {{ item.prop }} patterns
        label = template.replace(
          /\{\{\s*item\.(\w+)\s*\}\}/g,
          (_, prop: string) => String(obj[prop] ?? ''),
        )
        // Strip HTML tags for display
        label = label.replace(/<[^>]*>/g, '').trim()
      }
      if (!label) {
        label = String(obj.label ?? obj.name ?? obj.title ?? value)
      }

      return { label, value }
    }
    return { label: String(item), value: String(item) }
  })
}

/**
 * useDataSource — reactive data source for form select components.
 */
export function useDataSource(options: Ref<DataSourceOptions> | DataSourceOptions) {
  const opts = ref(typeof options === 'object' && 'value' in options ? options : options) as Ref<DataSourceOptions>

  const items = ref<SelectValue[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ─── Computed URL with search ────────────────────────────
  const fetchUrl = computed(() => {
    let url = opts.value.url
    if (!url) return null

    // Append search query if present
    if (searchQuery.value) {
      const separator = url.includes('?') ? '&' : '?'
      url += `${separator}q=${encodeURIComponent(searchQuery.value)}`
    }
    return url
  })

  // ─── Fetch from URL ──────────────────────────────────────
  async function fetchFromUrl(url: string): Promise<SelectValue[]> {
    const ttl = opts.value.cacheTtlMs ?? DEFAULT_TTL

    // Check cache
    const cached = cache.get(url)
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...opts.value.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    const rawItems = Array.isArray(json) ? json : (json.data ?? json.results ?? json.items ?? [])

    const mapped = mapToSelectValues(
      rawItems as unknown[],
      opts.value.valueProperty,
      opts.value.template,
    )

    // Store in cache
    cache.set(url, { data: mapped, timestamp: Date.now() })

    return mapped
  }

  // ─── Parse inline JSON ───────────────────────────────────
  function parseInlineJson(): SelectValue[] {
    const jsonData = opts.value.json
    if (!jsonData) return []

    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      if (Array.isArray(parsed)) {
        return mapToSelectValues(parsed, opts.value.valueProperty, opts.value.template)
      }
    } catch {
      // Invalid JSON
    }
    return []
  }

  // ─── Load data ───────────────────────────────────────────
  async function load(): Promise<void> {
    error.value = null

    // Priority 1: Static values
    if (opts.value.values && opts.value.values.length > 0) {
      items.value = opts.value.values
      return
    }

    // Priority 2: Inline JSON
    if (opts.value.json) {
      items.value = parseInlineJson()
      return
    }

    // Priority 3: Remote URL
    if (fetchUrl.value) {
      isLoading.value = true
      try {
        items.value = await fetchFromUrl(fetchUrl.value)
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to fetch data'
        items.value = []
      } finally {
        isLoading.value = false
      }
      return
    }

    items.value = []
  }

  // ─── Search with debounce ────────────────────────────────
  function search(query: string): void {
    searchQuery.value = query

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      load()
    }, opts.value.debounceMs ?? 300)
  }

  // ─── Clear cache ─────────────────────────────────────────
  function clearCache(url?: string): void {
    if (url) {
      cache.delete(url)
    } else {
      cache.clear()
    }
  }

  // ─── Auto-load when options change ───────────────────────
  watch(
    () => [opts.value.url, opts.value.json, opts.value.values],
    () => load(),
    { immediate: true },
  )

  // ─── Cleanup ─────────────────────────────────────────────
  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return {
    items,
    isLoading,
    error,
    searchQuery,
    load,
    search,
    clearCache,
  }
}
