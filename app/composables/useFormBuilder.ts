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
import { generateComponentKey } from '../utils/schema-parser'

export function useFormBuilder(initialSchema?: FormSchema) {
  const { getBuilderGroups, createDefaultSchema } = useComponentRegistry()

  // ─── State ─────────────────────────────────────────────────
  const schema = ref<FormSchema>(
    initialSchema ?? {
      display: 'form',
      components: [],
    },
  )

  const selectedComponentIndex = ref<number | null>(null)
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

  const selectedComponent = computed<FormComponentSchema | null>(() => {
    if (selectedComponentIndex.value === null) return null
    return schema.value.components[selectedComponentIndex.value] ?? null
  })

  const builderGroups = computed(() => getBuilderGroups())

  const existingKeys = computed(() =>
    schema.value.components.map((c) => c.key),
  )

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // ─── History ───────────────────────────────────────────────
  function pushHistory(): void {
    const snapshot = JSON.parse(JSON.stringify(toRaw(schema.value))) as FormSchema

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
    schema.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value]),
    ) as FormSchema
    selectedComponentIndex.value = null
  }

  function redo(): void {
    if (!canRedo.value) return
    historyIndex.value++
    schema.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value]),
    ) as FormSchema
    selectedComponentIndex.value = null
  }

  // ─── Component Operations ─────────────────────────────────
  /**
   * Add a new component to the form.
   */
  function addComponent(
    type: string,
    index?: number,
  ): FormComponentSchema | null {
    const baseSchema = createDefaultSchema(type)
    if (!baseSchema) return null

    pushHistory()

    // Generate unique key
    baseSchema.key = generateComponentKey(type, existingKeys.value)
    baseSchema.label = baseSchema.label ?? type.charAt(0).toUpperCase() + type.slice(1)

    const newComponents = [...schema.value.components]
    const insertIndex = index ?? newComponents.length

    newComponents.splice(insertIndex, 0, baseSchema)
    schema.value = { ...schema.value, components: newComponents }

    selectedComponentIndex.value = insertIndex
    return baseSchema
  }

  /**
   * Remove a component by index.
   */
  function removeComponent(index: number): void {
    if (index < 0 || index >= schema.value.components.length) return

    pushHistory()

    const newComponents = [...schema.value.components]
    newComponents.splice(index, 1)
    schema.value = { ...schema.value, components: newComponents }

    // Adjust selection
    if (selectedComponentIndex.value === index) {
      selectedComponentIndex.value = null
    } else if (
      selectedComponentIndex.value !== null &&
      selectedComponentIndex.value > index
    ) {
      selectedComponentIndex.value--
    }
  }

  /**
   * Move a component from one index to another.
   */
  function moveComponent(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= schema.value.components.length) return
    if (toIndex < 0 || toIndex > schema.value.components.length) return

    pushHistory()

    const newComponents = [...schema.value.components]
    const [moved] = newComponents.splice(fromIndex, 1)
    newComponents.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, moved)
    schema.value = { ...schema.value, components: newComponents }

    // Update selection
    if (selectedComponentIndex.value === fromIndex) {
      selectedComponentIndex.value = toIndex > fromIndex ? toIndex - 1 : toIndex
    }
  }

  /**
   * Update a component's properties.
   */
  function updateComponent(
    index: number,
    updates: Partial<FormComponentSchema>,
  ): void {
    if (index < 0 || index >= schema.value.components.length) return

    pushHistory()

    const newComponents = [...schema.value.components]
    newComponents[index] = { ...newComponents[index], ...updates }
    schema.value = { ...schema.value, components: newComponents }
  }

  /**
   * Duplicate a component.
   */
  function duplicateComponent(index: number): void {
    if (index < 0 || index >= schema.value.components.length) return

    pushHistory()

    const original = schema.value.components[index]
    const clone = JSON.parse(JSON.stringify(toRaw(original))) as FormComponentSchema
    clone.key = generateComponentKey(original.type, existingKeys.value)

    const newComponents = [...schema.value.components]
    newComponents.splice(index + 1, 0, clone)
    schema.value = { ...schema.value, components: newComponents }

    selectedComponentIndex.value = index + 1
  }

  /**
   * Select a component for editing.
   */
  function selectComponent(index: number | null): void {
    selectedComponentIndex.value = index
  }

  /**
   * Clear all components.
   */
  function clearForm(): void {
    pushHistory()
    schema.value = { ...schema.value, components: [] }
    selectedComponentIndex.value = null
  }

  /**
   * Import a schema.
   */
  function importSchema(newSchema: FormSchema): void {
    pushHistory()
    schema.value = JSON.parse(JSON.stringify(newSchema)) as FormSchema
    selectedComponentIndex.value = null
  }

  /**
   * Export the current schema as a clean JSON object.
   */
  function exportSchema(): FormSchema {
    return JSON.parse(JSON.stringify(toRaw(schema.value))) as FormSchema
  }

  /**
   * Toggle preview mode.
   */
  function togglePreview(): void {
    isPreviewMode.value = !isPreviewMode.value
    selectedComponentIndex.value = null
  }

  // ─── Initialize history ────────────────────────────────────
  pushHistory()

  return {
    // State
    schema,
    components,
    selectedComponent,
    selectedComponentIndex,
    isPreviewMode,
    builderGroups,
    canUndo,
    canRedo,

    // Component Operations
    addComponent,
    removeComponent,
    moveComponent,
    updateComponent,
    duplicateComponent,
    selectComponent,

    // Form Operations
    clearForm,
    importSchema,
    exportSchema,
    togglePreview,

    // History
    undo,
    redo,
  }
}
