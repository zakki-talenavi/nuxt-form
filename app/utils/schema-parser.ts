/**
 * ========================================
 * Schema Parser Utility
 * ========================================
 * Parses, validates, and transforms Form.io-compatible JSON schemas.
 * Extracts default values, flattens nested components, and provides
 * schema manipulation helpers.
 */

import type {
  FormSchema,
  FormComponentSchema,
  FormSubmission,
  FormValidation,
  FieldValue,
  ValidationError,
} from '../types/form'
import jsonLogicLib from 'json-logic-js'
const jsonLogic = (jsonLogicLib as any).default || jsonLogicLib

/**
 * Parse and validate a form schema.
 * Ensures the schema has the required structure.
 */
export function parseFormSchema(input: unknown): FormSchema {
  if (!input || typeof input !== 'object') {
    return { components: [] }
  }

  const raw = input as Record<string, unknown>

  return {
    display: (raw.display as FormSchema['display']) ?? 'form',
    title: (raw.title as string) ?? '',
    name: (raw.name as string) ?? '',
    path: (raw.path as string) ?? '',
    components: Array.isArray(raw.components)
      ? raw.components.map(normalizeComponent)
      : [],
    settings: (raw.settings as Record<string, unknown>) ?? {},
    properties: (raw.properties as Record<string, unknown>) ?? {},
    _id: raw._id as string | undefined,
  }
}

/**
 * Normalize a single component schema, ensuring defaults.
 */
export function normalizeComponent(raw: unknown): FormComponentSchema {
  if (!raw || typeof raw !== 'object') {
    return { type: 'unknown', key: 'unknown', input: false }
  }

  const comp = raw as Record<string, unknown>

  const normalized: FormComponentSchema = {
    type: (comp.type as string) ?? 'unknown',
    key: (comp.key as string) ?? `field_${Date.now()}`,
    label: (comp.label as string) ?? '',
    placeholder: (comp.placeholder as string) ?? '',
    description: (comp.description as string) ?? '',
    tooltip: (comp.tooltip as string) ?? '',
    input: (comp.input as boolean) ?? true,
    hidden: (comp.hidden as boolean) ?? false,
    disabled: (comp.disabled as boolean) ?? false,
    multiple: (comp.multiple as boolean) ?? false,
    tableView: (comp.tableView as boolean) ?? false,
    defaultValue: comp.defaultValue,
    validate: normalizeValidation(comp.validate),
    conditional: comp.conditional as FormComponentSchema['conditional'],
    customClass: (comp.customClass as string) ?? '',
    data: comp.data as FormComponentSchema['data'],
    valueProperty: comp.valueProperty as string | undefined,
    template: comp.template as string | undefined,
    properties: comp.properties as Record<string, unknown> | undefined,
    logic: comp.logic as any,
    action: comp.action as string | undefined,
    theme: comp.theme as string | undefined,
    block: comp.block as boolean | undefined,
    leftIcon: comp.leftIcon as string | undefined,
    rightIcon: comp.rightIcon as string | undefined,
    disableOnInvalid: comp.disableOnInvalid as boolean | undefined,
    prefix: comp.prefix as string | undefined,
    suffix: comp.suffix as string | undefined,
    labelPosition: comp.labelPosition as 'top' | 'left-left' | 'left-right' | 'right-left' | 'right-right' | 'bottom' | undefined,
    widget: comp.widget as Record<string, unknown> | string | undefined,
  }

  // Recursively normalize nested components
  if (Array.isArray(comp.components)) {
    normalized.components = comp.components.map(normalizeComponent)
  }

  // Normalize columns
  if (Array.isArray(comp.columns)) {
    normalized.columns = (comp.columns as Record<string, unknown>[]).map((col) => ({
      components: Array.isArray(col.components)
        ? col.components.map(normalizeComponent)
        : [],
      width: (col.width as number) ?? 6,
      offset: (col.offset as number) ?? 0,
      push: (col.push as number) ?? 0,
      pull: (col.pull as number) ?? 0,
      size: (col.size as 'md') ?? 'md',
    }))
  }

  return normalized
}

/**
 * Normalize validation rules
 */
function normalizeValidation(raw: unknown): FormValidation {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const v = raw as Record<string, unknown>

  return {
    required: (v.required as boolean) ?? false,
    minLength: v.minLength != null ? Number(v.minLength) : undefined,
    maxLength: v.maxLength != null ? Number(v.maxLength) : undefined,
    min: v.min != null ? Number(v.min) : undefined,
    max: v.max != null ? Number(v.max) : undefined,
    pattern: (v.pattern as string) ?? undefined,
    custom: (v.custom as string) ?? undefined,
    customMessage: (v.customMessage as string) ?? undefined,
  }
}

/**
 * Extract default values from schema components.
 * Returns a flat key-value map ready for submission data.
 */
export function extractDefaultValues(
  components: FormComponentSchema[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  for (const comp of components) {
    if (comp.input !== false && comp.key) {
      defaults[comp.key] = getDefaultForType(comp)
    }

    // Recurse into nested components
    if (Array.isArray(comp.components)) {
      Object.assign(defaults, extractDefaultValues(comp.components))
    }

    // Recurse into columns
    if (Array.isArray(comp.columns)) {
      for (const col of comp.columns) {
        if (Array.isArray(col.components)) {
          Object.assign(defaults, extractDefaultValues(col.components))
        }
      }
    }
  }

  return defaults
}

/**
 * Get default value for a component type.
 */
function getDefaultForType(comp: FormComponentSchema): FieldValue {
  if (comp.defaultValue !== undefined) {
    return comp.defaultValue as FieldValue
  }

  switch (comp.type) {
    case 'textfield':
    case 'textarea':
    case 'email':
    case 'password':
    case 'phoneNumber':
    case 'url':
      return ''
    case 'number':
    case 'currency':
      return null
    case 'checkbox':
      return false
    case 'select':
      return comp.multiple ? [] : ''
    case 'selectboxes':
      return {}
    case 'radio':
      return ''
    case 'datetime':
    case 'time':
    case 'day':
      return ''
    case 'file':
      return comp.multiple ? [] : null
    default:
      return ''
  }
}

/**
 * Flatten all input components from a schema into a flat array.
 * Useful for validation and data processing.
 */
export function flattenComponents(
  components: FormComponentSchema[],
): FormComponentSchema[] {
  const result: FormComponentSchema[] = []

  for (const comp of components) {
    if (comp.input !== false) {
      result.push(comp)
    }

    if (Array.isArray(comp.components)) {
      result.push(...flattenComponents(comp.components))
    }

    if (Array.isArray(comp.columns)) {
      for (const col of comp.columns) {
        if (Array.isArray(col.components)) {
          result.push(...flattenComponents(col.components))
        }
      }
    }
  }

  return result
}

// ─── Validation Regex Constants ────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/

/**
 * Safely evaluate a custom validation expression.
 * The expression gets access to `value`, `data`, `row`, and `component`.
 * Returns true if valid.
 */
function evaluateCustomValidation(
  expression: string,
  value: unknown,
  data: Record<string, unknown>,
  component: FormComponentSchema,
): { valid: boolean; message?: string } {
  try {
    // Create a sandboxed function that returns `valid` or a string error message
    const fn = new Function(
      'value', 'data', 'row', 'component', 'input',
      `"use strict";
       let valid = true;
       ${expression}
       return valid;`,
    )
    const result = fn(value, data, data, component, value)

    if (typeof result === 'string') {
      return { valid: false, message: result }
    }
    return { valid: result !== false }
  } catch {
    // If expression fails, treat as valid (don't block user)
    return { valid: true }
  }
}

/**
 * Evaluate a JSON Logic rule using the official json-logic-js library.
 */
function evaluateJsonLogic(
  rule: Record<string, unknown>,
  data: Record<string, unknown>,
): boolean {
  try {
    return !!jsonLogic.apply(rule, data)
  } catch (err) {
    console.error('JSON Logic Evaluation Error:', err)
    return false
  }
}


/**
 * Validate a single field value against its component schema.
 */
export function validateField(
  component: FormComponentSchema,
  value: unknown,
  formData?: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = []
  const rules = component.validate

  if (!rules) return errors

  const label = component.label || component.key
  const strValue = typeof value === 'string' ? value : ''
  const isEmpty = value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0)

  // ── Required ──────────────────────────────────────────────
  if (rules.required) {
    // Checkbox: must be `true`
    if (component.type === 'checkbox' && value !== true) {
      errors.push({ key: component.key, message: `${label} is required`, type: 'required' })
      return errors
    }
    // SelectBoxes: at least one must be true
    if (component.type === 'selectboxes' && typeof value === 'object' && value !== null) {
      const hasSelected = Object.values(value as Record<string, boolean>).some(v => v === true)
      if (!hasSelected) {
        errors.push({ key: component.key, message: `${label} is required`, type: 'required' })
        return errors
      }
    } else if (isEmpty) {
      errors.push({ key: component.key, message: `${label} is required`, type: 'required' })
      return errors
    }
  }

  // Skip further validation if empty and not required
  if (isEmpty) return errors

  // ── Email ─────────────────────────────────────────────────
  if ((rules.email || component.type === 'email') && typeof value === 'string') {
    if (!EMAIL_REGEX.test(value)) {
      errors.push({
        key: component.key,
        message: rules.customMessage || `${label} must be a valid email address`,
        type: 'email',
      })
    }
  }

  // ── URL ───────────────────────────────────────────────────
  if ((rules.url || component.type === 'url') && typeof value === 'string') {
    if (!URL_REGEX.test(value)) {
      errors.push({
        key: component.key,
        message: rules.customMessage || `${label} must be a valid URL`,
        type: 'url',
      })
    }
  }

  // ── Integer ───────────────────────────────────────────────
  if (rules.integer && typeof value === 'number') {
    if (!Number.isInteger(value)) {
      errors.push({
        key: component.key,
        message: rules.customMessage || `${label} must be a whole number`,
        type: 'integer',
      })
    }
  }

  // ── Min length ────────────────────────────────────────────
  if (rules.minLength != null && strValue.length < rules.minLength) {
    errors.push({
      key: component.key,
      message: `${label} must be at least ${rules.minLength} characters`,
      type: 'minLength',
    })
  }

  // ── Max length ────────────────────────────────────────────
  if (rules.maxLength != null && strValue.length > rules.maxLength) {
    errors.push({
      key: component.key,
      message: `${label} must be no more than ${rules.maxLength} characters`,
      type: 'maxLength',
    })
  }

  // ── Min words ─────────────────────────────────────────────
  if (rules.minWords != null && typeof value === 'string') {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < rules.minWords) {
      errors.push({
        key: component.key,
        message: `${label} must have at least ${rules.minWords} words`,
        type: 'minWords',
      })
    }
  }

  // ── Max words ─────────────────────────────────────────────
  if (rules.maxWords != null && typeof value === 'string') {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > rules.maxWords) {
      errors.push({
        key: component.key,
        message: `${label} must have no more than ${rules.maxWords} words`,
        type: 'maxWords',
      })
    }
  }

  // ── Min value (numbers) ───────────────────────────────────
  if (rules.min != null && typeof value === 'number' && value < rules.min) {
    errors.push({
      key: component.key,
      message: `${label} must be at least ${rules.min}`,
      type: 'min',
    })
  }

  // ── Max value (numbers) ───────────────────────────────────
  if (rules.max != null && typeof value === 'number' && value > rules.max) {
    errors.push({
      key: component.key,
      message: `${label} must be no more than ${rules.max}`,
      type: 'max',
    })
  }

  // ── Min selected (selectboxes) ────────────────────────────
  if (rules.minSelectedCount != null && typeof value === 'object' && value !== null) {
    const count = Object.values(value as Record<string, boolean>).filter(v => v === true).length
    if (count < rules.minSelectedCount) {
      errors.push({
        key: component.key,
        message: `${label} requires at least ${rules.minSelectedCount} selections`,
        type: 'minSelectedCount',
      })
    }
  }

  // ── Max selected (selectboxes) ────────────────────────────
  if (rules.maxSelectedCount != null && typeof value === 'object' && value !== null) {
    const count = Object.values(value as Record<string, boolean>).filter(v => v === true).length
    if (count > rules.maxSelectedCount) {
      errors.push({
        key: component.key,
        message: `${label} allows at most ${rules.maxSelectedCount} selections`,
        type: 'maxSelectedCount',
      })
    }
  }

  // ── Pattern ───────────────────────────────────────────────
  if (rules.pattern && typeof value === 'string') {
    const regex = new RegExp(rules.pattern)
    if (!regex.test(value)) {
      errors.push({
        key: component.key,
        message: rules.customMessage || `${label} does not match the required pattern`,
        type: 'pattern',
      })
    }
  }

  // ── Custom expression ─────────────────────────────────────
  if (rules.custom && typeof rules.custom === 'string') {
    const result = evaluateCustomValidation(
      rules.custom,
      value,
      formData || {},
      component,
    )
    if (!result.valid) {
      errors.push({
        key: component.key,
        message: result.message || rules.customMessage || `${label} is invalid`,
        type: 'custom',
      })
    }
  }

  // ── JSON Logic ────────────────────────────────────────────
  if (rules.json && typeof rules.json === 'object') {
    const logicResult = evaluateJsonLogic(rules.json, {
      ...formData,
      value,
    })
    if (!logicResult) {
      errors.push({
        key: component.key,
        message: rules.customMessage || `${label} does not satisfy the validation rule`,
        type: 'custom',
      })
    }
  }

  return errors
}

/**
 * Validate all fields in a form submission.
 */
export function validateSubmission(
  schema: FormSchema,
  data: Record<string, unknown>,
): ValidationError[] {
  const components = flattenComponents(schema.components)
  const errors: ValidationError[] = []

  for (const comp of components) {
    if (comp.hidden || comp.disabled) continue

    const value = data[comp.key]
    const fieldErrors = validateField(comp, value)
    errors.push(...fieldErrors)
  }

  return errors
}

/**
 * Evaluate conditional visibility for a component.
 */
export function evaluateConditional(
  component: FormComponentSchema,
  data: Record<string, unknown>,
): boolean {
  const conditional = component.conditional
  if (!conditional || conditional.when == null) {
    return !component.hidden
  }

  const triggerValue = data[conditional.when]
  const conditionMet = triggerValue === conditional.eq

  if (conditional.show === true) {
    return conditionMet
  }
  if (conditional.show === false) {
    return !conditionMet
  }

  return !component.hidden
}

/**
 * Create an empty submission object from a schema.
 */
export function createEmptySubmission(schema: FormSchema): FormSubmission {
  return {
    data: extractDefaultValues(schema.components),
    metadata: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      pathName: typeof window !== 'undefined' ? window.location.pathname : '',
      onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
    },
    state: 'submitted',
  }
}

/**
 * Generate a unique component key.
 */
export function generateComponentKey(type: string, existingKeys: string[]): string {
  let counter = 1
  let key = type

  while (existingKeys.includes(key)) {
    key = `${type}${counter}`
    counter++
  }

  return key
}
