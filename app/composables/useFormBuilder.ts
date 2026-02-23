/**
 * ========================================
 * Form Builder Composable
 * ========================================
 * Core composable for the drag-and-drop form builder.
 * Manages the form schema being built, component manipulation,
 * and live preview state.
 *
 * Replaces the 2200-line WebformBuilder.js class.
 */

import { ref, computed, toRaw } from 'vue'
import type {
  FormSchema,
  FormComponentSchema,
  BuilderComponentInfo,
} from '../types/form'
import { useComponentRegistry } from './useComponentRegistry'
import { generateComponentKey, eachComponent } from '../utils/schema-parser'

/**
 * Utility to safely deep clone an object, stripping any circular references
 * that might be accidentally injected by drag-and-drop libraries or Vue proxies.
 * 
 * Uses a WeakSet to track the traversal path, preventing true circular references 
 * without incorrectly dropping valid sibling duplicate objects.
 */
function safeClone<T>(obj: T, seen = new WeakSet()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (seen.has(obj)) {
    console.warn('[useFormBuilder] Removed circular reference')
    return undefined as unknown as T
  }
  
  seen.add(obj)
  
  if (Array.isArray(obj)) {
    const copy = obj.map((item) => safeClone(item, seen)) as unknown as T
    seen.delete(obj)
    return copy
  }
  
  const copy: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = safeClone((obj as Record<string, unknown>)[key], seen)
      if (val !== undefined) {
        copy[key] = val
      }
    }
  }
  
  seen.delete(obj)
  return copy as T
}

export function useFormBuilder(initialSchema?: FormSchema) {
  const { getBuilderGroups, createDefaultSchema } = useComponentRegistry()

  // ─── State ─────────────────────────────────────────────────
  const schema = ref<FormSchema>(
    initialSchema ?? {
      display: 'form',
      components: [],
    },
  )

  const selectedComponentKey = ref<string | null>(null)
  const isPreviewMode = ref(false)
  const history = ref<FormSchema[]>([])
  const historyIndex = ref(-1)

  // ─── Computed ──────────────────────────────────────────────
  const components = computed({
    get: () => schema.value.components,
    set: (val: FormComponentSchema[]) => {
      schema.value = { ...schema.value, components: val }
    },
  })

  // Deep search for the currently selected component
  const selectedComponent = computed<FormComponentSchema | null>(() => {
    console.log('[useFormBuilder] evaluating selectedComponent. key:', selectedComponentKey.value)
    if (!selectedComponentKey.value) return null
    let found: FormComponentSchema | null = null
    eachComponent(schema.value.components, (comp) => {
      if (comp.key === selectedComponentKey.value) found = comp
    })
    console.log('[useFormBuilder] found component:', found)
    return found
  })

  const builderGroups = computed(() => getBuilderGroups())

  const existingKeys = computed(() => {
    const keys: string[] = []
    eachComponent(schema.value.components, (c) => keys.push(c.key))
    return keys
  })

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // ─── History ───────────────────────────────────────────────
  function pushHistory(): void {
    const snapshot = safeClone(toRaw(schema.value))

    // Remove future states if we're in the middle of history
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(snapshot)

    // Limit history
    if (history.value.length > 50) {
      history.value.shift()
    }

    historyIndex.value = history.value.length - 1
  }

  function undo(): void {
    if (!canUndo.value) return
    historyIndex.value--
    schema.value = safeClone(history.value[historyIndex.value]) as FormSchema
    selectedComponentKey.value = null
  }

  function redo(): void {
    if (!canRedo.value) return
    historyIndex.value++
    schema.value = safeClone(history.value[historyIndex.value]) as FormSchema
    selectedComponentKey.value = null
  }

  // ─── Component Operations ─────────────────────────────────


  function addComponent(
    type: string,
    targetList: FormComponentSchema[] = schema.value.components,
    index?: number,
  ): FormComponentSchema | null {
    const baseSchema = createDefaultSchema(type)
    if (!baseSchema) return null

    pushHistory()

    // Generate unique key
    baseSchema.key = generateComponentKey(type, existingKeys.value)
    baseSchema.label = baseSchema.label ?? type.charAt(0).toUpperCase() + type.slice(1)

    const insertIndex = index ?? targetList.length

    targetList.splice(insertIndex, 0, baseSchema)

    selectedComponentKey.value = baseSchema.key
    return baseSchema
  }

  /**
   * Remove a component from a specific target array by its key.
   */
  function removeComponent(
    componentKey: string,
    targetList: FormComponentSchema[] = schema.value.components,
  ): void {
    const idx = targetList.findIndex(c => c.key === componentKey)
    if (idx === -1) return

    pushHistory()

    targetList.splice(idx, 1)

    // Adjust selection
    if (selectedComponentKey.value === componentKey) {
      selectedComponentKey.value = null
    }
  }

  /**
   * Move a component within the same list.
   */
  function moveComponent(
    targetList: FormComponentSchema[],
    fromIndex: number,
    toIndex: number
  ): void {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= targetList.length) return
    if (toIndex < 0 || toIndex > targetList.length) return

    pushHistory()

    const movedArray = targetList.splice(fromIndex, 1)
    if (movedArray.length > 0 && movedArray[0]) {
      targetList.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedArray[0])
    }
  }

  /**
   * Move a component across different lists (e.g. from root into a column).
   */
  function moveComponentBetweenLists(
    sourceList: FormComponentSchema[],
    sourceIndex: number,
    targetList: FormComponentSchema[],
    targetIndex: number
  ): void {
    if (sourceIndex < 0 || sourceIndex >= sourceList.length) return

    pushHistory()

    const movedArray = sourceList.splice(sourceIndex, 1)
    if (movedArray.length > 0 && movedArray[0]) {
      targetList.splice(targetIndex, 0, movedArray[0])
    }
  }

  /**
   * Update a component's properties by modifying the schema dynamically via reactivity.
   */
  function updateComponent(
    componentKey: string,
    updates: Partial<FormComponentSchema>,
  ): void {
    pushHistory()

    eachComponent(schema.value.components, (comp) => {
      if (comp.key === componentKey) {
        Object.assign(comp, updates)
      }
    })
  }

  /**
   * Duplicate a component within a target list.
   */
  function duplicateComponent(
    componentKey: string,
    targetList: FormComponentSchema[] = schema.value.components,
  ): void {
    const idx = targetList.findIndex(c => c.key === componentKey)
    if (idx === -1) return

    pushHistory()

    const original = targetList[idx]
    if (!original) return

    const clone = JSON.parse(JSON.stringify(toRaw(original))) as FormComponentSchema
    clone.key = generateComponentKey(original.type, existingKeys.value)

    targetList.splice(idx + 1, 0, clone)

    selectedComponentKey.value = clone.key
  }

  /**
   * Select a component for editing.
   */
  function selectComponent(key: string | null): void {
    console.log('[useFormBuilder] selectComponent called with key:', key)
    selectedComponentKey.value = key
  }

  /**
   * Clear all components.
   */
  function clearForm(): void {
    pushHistory()
    schema.value = { ...schema.value, components: [] }
    selectedComponentKey.value = null
  }

  /**
   * Import a schema.
   */
  function importSchema(newSchema: FormSchema): void {
    pushHistory()
    schema.value = JSON.parse(JSON.stringify(newSchema)) as FormSchema
    selectedComponentKey.value = null
  }

  /**
   * Export the current schema as a clean JSON object.
   */
  function exportSchema(): FormSchema {
    return safeClone(toRaw(schema.value))
  }

  /**
   * Toggle preview mode.
   */
  function togglePreview(): void {
    isPreviewMode.value = !isPreviewMode.value
    selectedComponentKey.value = null
  }

  // ─── Initialize history ────────────────────────────────────
  pushHistory()

  return {
    // State
    schema,
    components,
    selectedComponent,
    selectedComponentKey,
    builderGroups,
    existingKeys,
    canUndo,
    canRedo,
    isPreviewMode,

    // Actions
    addComponent,
    removeComponent,
    moveComponent,
    moveComponentBetweenLists,
    updateComponent,
    duplicateComponent,
    selectComponent,
    clearForm,
    importSchema,
    exportSchema,
    togglePreview,
    undo,
    redo,
  }
}
