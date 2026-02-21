/**
 * ========================================
 * Form Wizard Composable
 * ========================================
 * Multi-step form navigation with per-step validation,
 * progress tracking, and breadcrumb support.
 *
 * Integrates with useFormRenderer for data/errors.
 */

import { ref, computed, type Ref } from 'vue'
import type { FormComponentSchema, ValidationError } from '../types/form'
import { validateField } from '../utils/schema-parser'

export interface WizardPage {
  /** Index of this page (0-based) */
  index: number
  /** Title from the panel component */
  title: string
  /** Key of the panel component */
  key: string
  /** The panel component schema */
  component: FormComponentSchema
  /** Input components inside this page (flattened) */
  inputComponents: FormComponentSchema[]
}

export interface UseFormWizardOptions {
  /** Allow clicking on breadcrumb items to jump to pages */
  breadcrumbClickable?: boolean
  /** Linear mode — can only go to next page if current page is valid */
  linear?: boolean
}

/**
 * Flatten input components from nested structures.
 */
function flattenInputs(components: FormComponentSchema[]): FormComponentSchema[] {
  const result: FormComponentSchema[] = []
  for (const comp of components) {
    if (comp.input !== false && comp.type !== 'button') {
      result.push(comp)
    }
    if (Array.isArray(comp.components)) {
      result.push(...flattenInputs(comp.components))
    }
    if (Array.isArray(comp.columns)) {
      for (const col of comp.columns) {
        if (Array.isArray(col.components)) {
          result.push(...flattenInputs(col.components))
        }
      }
    }
  }
  return result
}

export function useFormWizard(
  schemaComponents: Ref<FormComponentSchema[]>,
  formData: Record<string, unknown>,
  options: UseFormWizardOptions = {},
) {
  const currentPage = ref(0)
  const visitedPages = ref<Set<number>>(new Set([0]))
  const pageErrors = ref<Map<number, ValidationError[]>>(new Map())

  // ─── Extract pages from top-level panels ─────────────────
  const pages = computed<WizardPage[]>(() => {
    return schemaComponents.value
      .filter((c) => c.type === 'panel')
      .map((comp, index) => ({
        index,
        title: (comp.title as string) || comp.label || `Page ${index + 1}`,
        key: comp.key,
        component: comp,
        inputComponents: flattenInputs(comp.components ?? []),
      }))
  })

  const totalPages = computed(() => pages.value.length)
  const isFirstPage = computed(() => currentPage.value === 0)
  const isLastPage = computed(() => currentPage.value === totalPages.value - 1)

  const currentPageData = computed(() => {
    return pages.value[currentPage.value] ?? null
  })

  const canNext = computed(() => !isLastPage.value)
  const canPrev = computed(() => !isFirstPage.value)

  // ─── Progress ─────────────────────────────────────────────
  const progress = computed(() => {
    if (totalPages.value <= 1) return 100
    return Math.round((currentPage.value / (totalPages.value - 1)) * 100)
  })

  // ─── Validate current page's fields ───────────────────────
  function validateCurrentPage(): ValidationError[] {
    const page = currentPageData.value
    if (!page) return []

    const errors: ValidationError[] = []
    for (const comp of page.inputComponents) {
      if (comp.hidden || comp.disabled) continue
      const value = formData[comp.key]
      const fieldErrors = validateField(comp, value, { ...formData })
      errors.push(...fieldErrors)
    }

    pageErrors.value = new Map(pageErrors.value)
    if (errors.length > 0) {
      pageErrors.value.set(currentPage.value, errors)
    } else {
      pageErrors.value.delete(currentPage.value)
    }

    return errors
  }

  // ─── Navigation ───────────────────────────────────────────
  function nextPage(): boolean {
    if (!canNext.value) return false

    // In linear mode, validate before advancing
    if (options.linear !== false) {
      const errors = validateCurrentPage()
      if (errors.length > 0) return false
    }

    currentPage.value++
    visitedPages.value.add(currentPage.value)
    return true
  }

  function prevPage(): boolean {
    if (!canPrev.value) return false
    currentPage.value--
    return true
  }

  function goToPage(index: number): boolean {
    if (index < 0 || index >= totalPages.value) return false

    // If not breadcrumb clickable, only allow visited pages
    if (!options.breadcrumbClickable && !visitedPages.value.has(index)) {
      return false
    }

    // In linear mode, validate current page before jumping forward
    if (options.linear !== false && index > currentPage.value) {
      const errors = validateCurrentPage()
      if (errors.length > 0) return false
    }

    currentPage.value = index
    visitedPages.value.add(index)
    return true
  }

  function reset(): void {
    currentPage.value = 0
    visitedPages.value = new Set([0])
    pageErrors.value = new Map()
  }

  // ─── Page state helpers ────────────────────────────────────
  function isPageValid(index: number): boolean {
    return !pageErrors.value.has(index)
  }

  function isPageVisited(index: number): boolean {
    return visitedPages.value.has(index)
  }

  function isPageCurrent(index: number): boolean {
    return currentPage.value === index
  }

  return {
    // State
    currentPage,
    totalPages,
    pages,
    currentPageData,
    progress,
    pageErrors,
    isFirstPage,
    isLastPage,
    canNext,
    canPrev,
    visitedPages,

    // Methods
    nextPage,
    prevPage,
    goToPage,
    reset,
    validateCurrentPage,

    // Helpers
    isPageValid,
    isPageVisited,
    isPageCurrent,
  }
}
