/**
 * ========================================
 * Form.io Compatible Type Definitions
 * ========================================
 * Full TypeScript types for form schema, components, validation,
 * events, and builder metadata. Compatible with Form.io JSON schema.
 */

// ─── Validation Types ──────────────────────────────────────────
export interface FormValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  custom?: string
  customMessage?: string
  json?: Record<string, unknown>
  // Phase 4 additions
  integer?: boolean
  unique?: boolean
  email?: boolean
  url?: boolean
  minSelectedCount?: number
  maxSelectedCount?: number
  minWords?: number
  maxWords?: number
}

// ─── Conditional Logic ─────────────────────────────────────────
export interface FormConditional {
  show?: boolean | null
  when?: string
  eq?: string | number | boolean
  json?: Record<string, unknown>
}

// ─── Select Data Source ────────────────────────────────────────
export interface SelectValue {
  label: string
  value: string | number | boolean
}

export interface SelectData {
  values?: SelectValue[]
  json?: string | Record<string, unknown>[]
  url?: string
  resource?: string
  custom?: string
}

// ─── Base Component Schema ─────────────────────────────────────
export interface FormComponentSchema {
  type: string
  key: string
  label?: string
  placeholder?: string
  description?: string
  tooltip?: string
  input?: boolean
  hidden?: boolean
  disabled?: boolean
  tableView?: boolean
  multiple?: boolean
  defaultValue?: unknown
  validate?: FormValidation
  conditional?: FormConditional
  customClass?: string
  properties?: Record<string, unknown>

  // Select-specific
  data?: SelectData
  valueProperty?: string
  template?: string

  // Layout components
  columns?: FormColumnSchema[]

  // Nested components
  components?: FormComponentSchema[]

  // Calculated values
  calculateValue?: string

  // Panel/wizard page title
  title?: string

  // Additional properties (extensible)
  [key: string]: unknown
}

// ─── Column Layout ─────────────────────────────────────────────
export interface FormColumnSchema {
  components: FormComponentSchema[]
  width?: number
  offset?: number
  push?: number
  pull?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

// ─── Root Form Schema ──────────────────────────────────────────
export interface FormSchema {
  display?: 'form' | 'wizard' | 'pdf'
  title?: string
  name?: string
  path?: string
  components: FormComponentSchema[]
  settings?: Record<string, unknown>
  properties?: Record<string, unknown>
  controller?: string
  _id?: string
}

// ─── Submission Data ───────────────────────────────────────────
export interface FormSubmission {
  data: Record<string, unknown>
  metadata?: {
    timezone?: string
    offset?: number
    origin?: string
    referrer?: string
    browserName?: string
    userAgent?: string
    pathName?: string
    onLine?: boolean
    [key: string]: unknown
  }
  state?: 'submitted' | 'draft'
  _id?: string
}

// ─── Validation Error ──────────────────────────────────────────
export interface ValidationError {
  key: string
  message: string
  type:
    | 'required'
    | 'minLength'
    | 'maxLength'
    | 'min'
    | 'max'
    | 'pattern'
    | 'custom'
    | 'email'
    | 'url'
    | 'integer'
    | 'unique'
    | 'minSelectedCount'
    | 'maxSelectedCount'
    | 'minWords'
    | 'maxWords'
  level?: 'error' | 'warning'
}

// ─── Component Render Props ────────────────────────────────────
export interface FieldProps {
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}

// ─── Component Registry ────────────────────────────────────────
export interface ComponentRegistryEntry {
  component: ReturnType<typeof defineAsyncComponent> | Component
  builderInfo: BuilderComponentInfo
  defaultSchema: Partial<FormComponentSchema>
}

// ─── Builder Types ─────────────────────────────────────────────
export interface BuilderComponentInfo {
  title: string
  icon: string
  group: string
  weight: number
  documentation?: string
  schema: Partial<FormComponentSchema>
}

export interface BuilderGroup {
  key: string
  title: string
  icon: string
  weight: number
  components: BuilderComponentInfo[]
}

export interface BuilderDragItem {
  schema: FormComponentSchema
  index: number
  isNew?: boolean
}

// ─── Form Events ───────────────────────────────────────────────
export type FormEventType =
  | 'change'
  | 'submit'
  | 'submitDone'
  | 'submitError'
  | 'formLoad'
  | 'render'
  | 'error'
  | 'invalid'
  | 'valid'
  | 'componentChange'
  | 'focus'
  | 'blur'
  | 'resetForm'

export interface FormEvent {
  type: FormEventType
  data?: unknown
  component?: FormComponentSchema
  changed?: {
    component: FormComponentSchema
    value: unknown
    oldValue: unknown
  }
}

// ─── Form Renderer Options ─────────────────────────────────────
export interface FormRendererOptions {
  readOnly?: boolean
  disabled?: boolean
  language?: string
  i18n?: Record<string, Record<string, string>>
  sanitize?: boolean
  noDefaults?: boolean
  showErrors?: 'submit' | 'change' | 'blur'
}

// ─── Utility Types ─────────────────────────────────────────────
export type FieldValue = string | number | boolean | null | undefined | unknown[] | Record<string, unknown>

/** Type guard helper */
export function isFormComponentSchema(value: unknown): value is FormComponentSchema {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'key' in value &&
    typeof (value as FormComponentSchema).type === 'string' &&
    typeof (value as FormComponentSchema).key === 'string'
  )
}

// Need to import Vue types for ComponentRegistryEntry
import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'
