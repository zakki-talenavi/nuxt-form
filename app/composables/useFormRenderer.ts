/**
 * ========================================
 * Form Renderer Composable
 * ========================================
 * Core composable that manages form state, data binding,
 * validation, and submission logic.
 *
 * Replaces Webform.js class with a reactive composable
 * pattern using Vue 3 Composition API.
 */

import { ref, reactive, computed, watch, toRaw } from 'vue'
import type {
  FormSchema,
  FormComponentSchema,
  FormSubmission,
  ValidationError,
  FormRendererOptions,
} from '../types/form'
import {
  parseFormSchema,
  extractDefaultValues,
  flattenComponents,
  validateField,
  evaluateConditional,
  createEmptySubmission,
} from '../utils/schema-parser'

export function useFormRenderer(
  initialSchema?: FormSchema,
  options: FormRendererOptions = {},
) {
  // ─── Core State ────────────────────────────────────────────
  const schema = ref<FormSchema>(
    initialSchema ? parseFormSchema(initialSchema) : { components: [] },
  )
  const formData = reactive<Record<string, unknown>>({})
  const errors = ref<Map<string, ValidationError[]>>(new Map())
  const isSubmitting = ref(false)
  const isValid = ref(true)
  const isDirty = ref(false)
  const showErrors = ref<boolean>(false)

  // ─── Derived State ─────────────────────────────────────────
  const allComponents = computed(() =>
    flattenComponents(schema.value.components),
  )

  const allErrors = computed(() => {
    const result: ValidationError[] = []
    for (const errs of errors.value.values()) {
      result.push(...errs)
    }
    return result
  })

  const errorCount = computed(() => allErrors.value.length)

  const submission = computed<FormSubmission>(() => ({
    data: { ...toRaw(formData) },
    metadata: {
      timezone: typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC',
    },
    state: 'submitted',
  }))

  // ─── Methods ───────────────────────────────────────────────

  /**
   * Set/replace the form schema and reset data.
   */
  function setSchema(newSchema: FormSchema): void {
    schema.value = parseFormSchema(newSchema)
    resetData()
  }

  /**
   * Reset form data to defaults from schema.
   */
  function resetData(): void {
    const defaults = extractDefaultValues(schema.value.components)

    // Clear existing data
    for (const key of Object.keys(formData)) {
      delete formData[key]
    }

    // Set defaults
    Object.assign(formData, defaults)
    errors.value = new Map()
    isDirty.value = false
    showErrors.value = false
    isValid.value = true
  }

  /**
   * Set form data from a submission.
   */
  function setSubmission(sub: FormSubmission): void {
    const defaults = extractDefaultValues(schema.value.components)

    // Clear existing
    for (const key of Object.keys(formData)) {
      delete formData[key]
    }

    // Merge defaults with submission data
    Object.assign(formData, defaults, sub.data)
    isDirty.value = false
  }

  /**
   * Update a single field value.
   */
  function setFieldValue(key: string, value: unknown): void {
    formData[key] = value
    isDirty.value = true

    // Validate on change if configured
    if (options.showErrors === 'change') {
      validateFieldByKey(key)
    }
  }

  /**
   * Get a single field value.
   */
  function getFieldValue(key: string): unknown {
    return formData[key]
  }

  /**
   * Validate a single field by its key.
   */
  function validateFieldByKey(key: string): ValidationError[] {
    const component = allComponents.value.find((c) => c.key === key)
    if (!component) return []

    const value = formData[key]
    const fieldErrors = validateField(component, value, { ...formData })

    const newErrors = new Map(errors.value)
    if (fieldErrors.length > 0) {
      newErrors.set(key, fieldErrors)
    } else {
      newErrors.delete(key)
    }
    errors.value = newErrors

    updateValidity()
    return fieldErrors
  }

  /**
   * Validate all fields in the form.
   */
  function validateAll(): ValidationError[] {
    const newErrors = new Map<string, ValidationError[]>()

    for (const comp of allComponents.value) {
      if (comp.hidden || comp.disabled) continue

      // Check conditional visibility
      if (!isComponentVisible(comp)) continue

      const value = formData[comp.key]
      const fieldErrors = validateField(comp, value, { ...formData })

      if (fieldErrors.length > 0) {
        newErrors.set(comp.key, fieldErrors)
      }
    }

    errors.value = newErrors
    showErrors.value = true
    updateValidity()

    return allErrors.value
  }

  /**
   * Check if the form is valid and update the isValid state.
   */
  function updateValidity(): void {
    isValid.value = errors.value.size === 0
  }

  /**
   * Get errors for a specific field.
   */
  function getFieldErrors(key: string): ValidationError[] {
    return errors.value.get(key) ?? []
  }

  /**
   * Check if a component should be visible based on conditional logic.
   */
  function isComponentVisible(component: FormComponentSchema): boolean {
    return evaluateConditional(component, formData)
  }

  /**
   * Submit the form.
   * Validates all fields first, returns submission or errors.
   */
  async function submitForm(): Promise<{
    success: boolean
    submission?: FormSubmission
    errors?: ValidationError[]
  }> {
    isSubmitting.value = true

    try {
      const validationErrors = validateAll()

      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        }
      }

      return {
        success: true,
        submission: submission.value,
      }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Handle field blur event — validate if configured.
   */
  function handleFieldBlur(key: string): void {
    if (options.showErrors === 'blur' || options.showErrors === 'change') {
      validateFieldByKey(key)
      showErrors.value = true
    }
  }

  // ─── Init ──────────────────────────────────────────────────
  if (initialSchema) {
    resetData()
  }

  return {
    // State
    schema,
    formData,
    errors,
    allErrors,
    errorCount,
    isSubmitting,
    isValid,
    isDirty,
    showErrors,
    submission,
    allComponents,

    // Methods
    setSchema,
    resetData,
    setSubmission,
    setFieldValue,
    getFieldValue,
    validateFieldByKey,
    validateAll,
    getFieldErrors,
    isComponentVisible,
    submitForm,
    handleFieldBlur,
  }
}
