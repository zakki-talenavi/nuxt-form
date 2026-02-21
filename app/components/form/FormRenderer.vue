<script setup lang="ts">
/**
 * ========================================
 * FormRenderer Component
 * ========================================
 * The main form rendering engine.
 * Accepts a Form.io-compatible JSON schema and renders
 * a fully reactive, validated form using registered components.
 *
 * Supports all field types: text inputs, selects, checkboxes,
 * date/time pickers, file uploads, signatures, and layout
 * components (columns, panels, tabs, fieldsets, etc.)
 *
 * Usage:
 * <FormRenderer :schema="mySchema" v-model="formData" @submit="handleSubmit" />
 */
import { watch, provide, computed, nextTick } from 'vue'
import type { FormSchema, FormSubmission, FormComponentSchema, ValidationError } from '../../types/form'
import { useFormRenderer } from '../../composables/useFormRenderer'
import { useComponentRegistry } from '../../composables/useComponentRegistry'
import FormWizard from './FormWizard.vue'

// ─── Built-in field components ───────────────────────────────
// Basic input fields
import TextField from './fields/TextField.vue'
import TextAreaField from './fields/TextAreaField.vue'
import SelectField from './fields/SelectField.vue'
import CheckboxField from './fields/CheckboxField.vue'
import NumberField from './fields/NumberField.vue'
import PasswordField from './fields/PasswordField.vue'
import EmailField from './fields/EmailField.vue'
import UrlField from './fields/UrlField.vue'
import PhoneNumberField from './fields/PhoneNumberField.vue'
import CurrencyField from './fields/CurrencyField.vue'

// Date & time
import DateTimeField from './fields/DateTimeField.vue'
import TimeField from './fields/TimeField.vue'
import DayField from './fields/DayField.vue'

// Choice fields
import RadioField from './fields/RadioField.vue'
import SelectBoxesField from './fields/SelectBoxesField.vue'
import TagsField from './fields/TagsField.vue'

// Special fields
import SignatureField from './fields/SignatureField.vue'
import FileField from './fields/FileField.vue'
import HiddenField from './fields/HiddenField.vue'
import ButtonField from './fields/ButtonField.vue'

// Layout components
import ColumnsField from './fields/ColumnsField.vue'
import FieldsetField from './fields/FieldsetField.vue'
import PanelField from './fields/PanelField.vue'
import WellField from './fields/WellField.vue'
import TableField from './fields/TableField.vue'
import TabsField from './fields/TabsField.vue'
import ContainerField from './fields/ContainerField.vue'

// Content components
import ContentField from './fields/ContentField.vue'
import HtmlElementField from './fields/HtmlElementField.vue'

// Data components
import DataGridField from './fields/DataGridField.vue'
import EditGridField from './fields/EditGridField.vue'
import DataMapField from './fields/DataMapField.vue'

// Advanced components
import SurveyField from './fields/SurveyField.vue'
import AddressField from './fields/AddressField.vue'
import FormField from './fields/FormField.vue'
import RecaptchaField from './fields/RecaptchaField.vue'
import TreeField from './fields/TreeField.vue'

const props = withDefaults(
  defineProps<{
    schema: FormSchema
    modelValue?: Record<string, unknown>
    readOnly?: boolean
    disabled?: boolean
    showErrorsOn?: 'submit' | 'change' | 'blur'
    submitLabel?: string
    resetLabel?: string
    showReset?: boolean
  }>(),
  {
    modelValue: undefined,
    readOnly: false,
    disabled: false,
    showErrorsOn: 'blur',
    submitLabel: 'Submit',
    resetLabel: 'Reset',
    showReset: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [data: Record<string, unknown>]
  'submit': [submission: FormSubmission]
  'error': [errors: ValidationError[]]
  'change': [data: Record<string, unknown>]
  'fieldChange': [payload: { key: string; value: unknown }]
}>()

// ─── Registry: register all built-in components ──────────────
const registry = useComponentRegistry()

// --- Basic input fields ---
registry.register('textfield', TextField, {
  title: 'Text Field', icon: '📝', group: 'basic', weight: 0,
  schema: { type: 'textfield', key: 'textField', label: 'Text Field', input: true },
}, { placeholder: 'Enter text...' })

registry.register('textarea', TextAreaField, {
  title: 'Text Area', icon: '📄', group: 'basic', weight: 10,
  schema: { type: 'textarea', key: 'textArea', label: 'Text Area', input: true },
}, { rows: 3 })

registry.register('number', NumberField, {
  title: 'Number', icon: '🔢', group: 'basic', weight: 15,
  schema: { type: 'number', key: 'number', label: 'Number', input: true },
}, {})

registry.register('password', PasswordField, {
  title: 'Password', icon: '🔒', group: 'basic', weight: 18,
  schema: { type: 'password', key: 'password', label: 'Password', input: true },
}, {})

registry.register('email', EmailField, {
  title: 'Email', icon: '✉️', group: 'basic', weight: 12,
  schema: { type: 'email', key: 'email', label: 'Email', input: true },
}, {})

registry.register('url', UrlField, {
  title: 'URL', icon: '🔗', group: 'basic', weight: 14,
  schema: { type: 'url', key: 'url', label: 'URL', input: true },
}, {})

registry.register('phoneNumber', PhoneNumberField, {
  title: 'Phone Number', icon: '📞', group: 'basic', weight: 16,
  schema: { type: 'phoneNumber', key: 'phoneNumber', label: 'Phone Number', input: true },
}, {})

registry.register('select', SelectField, {
  title: 'Select', icon: '📋', group: 'basic', weight: 20,
  schema: {
    type: 'select', key: 'select', label: 'Select', input: true,
    data: { values: [{ label: 'Option 1', value: 'option1' }] },
  },
}, { data: { values: [] } })

registry.register('checkbox', CheckboxField, {
  title: 'Checkbox', icon: '☑️', group: 'basic', weight: 30,
  schema: { type: 'checkbox', key: 'checkbox', label: 'Checkbox', input: true },
}, {})

registry.register('radio', RadioField, {
  title: 'Radio', icon: '🔘', group: 'basic', weight: 32,
  schema: {
    type: 'radio', key: 'radio', label: 'Radio', input: true,
    values: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }],
  },
}, {})

registry.register('selectboxes', SelectBoxesField, {
  title: 'Select Boxes', icon: '☑️', group: 'basic', weight: 34,
  schema: {
    type: 'selectboxes', key: 'selectBoxes', label: 'Select Boxes', input: true,
    values: [{ label: 'Option A', value: 'a' }, { label: 'Option B', value: 'b' }],
  },
}, {})

// --- Advanced input fields ---
registry.register('currency', CurrencyField, {
  title: 'Currency', icon: '💰', group: 'advanced', weight: 40,
  schema: { type: 'currency', key: 'currency', label: 'Currency', input: true },
}, {})

registry.register('datetime', DateTimeField, {
  title: 'Date / Time', icon: '📅', group: 'advanced', weight: 42,
  schema: { type: 'datetime', key: 'dateTime', label: 'Date / Time', input: true },
}, {})

registry.register('time', TimeField, {
  title: 'Time', icon: '🕐', group: 'advanced', weight: 44,
  schema: { type: 'time', key: 'time', label: 'Time', input: true },
}, {})

registry.register('day', DayField, {
  title: 'Day', icon: '📆', group: 'advanced', weight: 46,
  schema: { type: 'day', key: 'day', label: 'Day', input: true },
}, {})

registry.register('tags', TagsField, {
  title: 'Tags', icon: '🏷️', group: 'advanced', weight: 48,
  schema: { type: 'tags', key: 'tags', label: 'Tags', input: true },
}, {})

registry.register('signature', SignatureField, {
  title: 'Signature', icon: '✍️', group: 'advanced', weight: 50,
  schema: { type: 'signature', key: 'signature', label: 'Signature', input: true },
}, {})

registry.register('file', FileField, {
  title: 'File Upload', icon: '📎', group: 'advanced', weight: 52,
  schema: { type: 'file', key: 'file', label: 'File Upload', input: true },
}, {})

registry.register('hidden', HiddenField, {
  title: 'Hidden', icon: '👁️‍🗨️', group: 'advanced', weight: 90,
  schema: { type: 'hidden', key: 'hidden', label: 'Hidden', input: true },
}, {})

registry.register('button', ButtonField, {
  title: 'Button', icon: '🔵', group: 'basic', weight: 100,
  schema: { type: 'button', key: 'submit', label: 'Submit', input: false, action: 'submit' },
}, {})

// --- Layout components ---
registry.register('columns', ColumnsField, {
  title: 'Columns', icon: '▥', group: 'layout', weight: 0,
  schema: {
    type: 'columns', key: 'columns', label: '', input: false,
    columns: [
      { components: [], width: 6 },
      { components: [], width: 6 },
    ],
  },
}, {})

registry.register('fieldset', FieldsetField, {
  title: 'Field Set', icon: '⬜', group: 'layout', weight: 10,
  schema: { type: 'fieldset', key: 'fieldSet', label: 'Field Set', input: false, components: [] },
}, {})

registry.register('panel', PanelField, {
  title: 'Panel', icon: '🗂️', group: 'layout', weight: 20,
  schema: { type: 'panel', key: 'panel', label: 'Panel', input: false, title: 'Panel', components: [] },
}, {})

registry.register('well', WellField, {
  title: 'Well', icon: '⬜', group: 'layout', weight: 30,
  schema: { type: 'well', key: 'well', label: '', input: false, components: [] },
}, {})

registry.register('table', TableField, {
  title: 'Table', icon: '⊞', group: 'layout', weight: 40,
  schema: { type: 'table', key: 'table', label: '', input: false, rows: [[{ components: [] }]] },
}, {})

registry.register('tabs', TabsField, {
  title: 'Tabs', icon: '📑', group: 'layout', weight: 50,
  schema: {
    type: 'tabs', key: 'tabs', label: '', input: false,
    components: [{ label: 'Tab 1', key: 'tab1', components: [] }],
  },
}, {})

registry.register('container', ContainerField, {
  title: 'Container', icon: '📦', group: 'layout', weight: 60,
  schema: { type: 'container', key: 'container', label: 'Container', input: false, components: [] },
}, {})

// --- Content components ---
registry.register('content', ContentField, {
  title: 'Content', icon: '📰', group: 'layout', weight: 70,
  schema: { type: 'content', key: 'content', label: '', input: false, html: '<p>Content goes here</p>' },
}, {})

registry.register('htmlelement', HtmlElementField, {
  title: 'HTML Element', icon: '🧩', group: 'layout', weight: 80,
  schema: { type: 'htmlelement', key: 'htmlelement', label: '', input: false, tag: 'div', content: '' },
}, {})

// --- Data components ---
registry.register('datagrid', DataGridField, {
  title: 'Data Grid', icon: '📊', group: 'data', weight: 30,
  schema: { type: 'datagrid', key: 'dataGrid', label: 'Data Grid', input: true, components: [] },
}, {})

registry.register('editgrid', EditGridField, {
  title: 'Edit Grid', icon: '📝', group: 'data', weight: 35,
  schema: { type: 'editgrid', key: 'editGrid', label: 'Edit Grid', input: true, components: [] },
}, {})

registry.register('datamap', DataMapField, {
  title: 'Data Map', icon: '🗂️', group: 'data', weight: 20,
  schema: { type: 'datamap', key: 'dataMap', label: 'Data Map', input: true },
}, {})

// --- Advanced components ---
registry.register('survey', SurveyField, {
  title: 'Survey', icon: '📋', group: 'advanced', weight: 110,
  schema: { type: 'survey', key: 'survey', label: 'Survey', input: true },
}, {})

registry.register('address', AddressField, {
  title: 'Address', icon: '🏠', group: 'advanced', weight: 35,
  schema: { type: 'address', key: 'address', label: 'Address', input: true },
}, {})

registry.register('form', FormField, {
  title: 'Nested Form', icon: '📄', group: 'advanced', weight: 115,
  schema: { type: 'form', key: 'form', label: 'Nested Form', input: true, components: [] },
}, {})

registry.register('tree', TreeField, {
  title: 'Tree', icon: '🌳', group: 'advanced', weight: 118,
  schema: { type: 'tree', key: 'tree', label: 'Tree', input: true, components: [] },
}, {})

registry.register('recaptcha', RecaptchaField, {
  title: 'reCAPTCHA', icon: '🔒', group: 'advanced', weight: 120,
  schema: { type: 'recaptcha', key: 'recaptcha', label: 'reCAPTCHA', input: false },
}, {})

// ─── Layout types that contain nested components ─────────────
const layoutTypes = new Set(['columns', 'fieldset', 'panel', 'well', 'table', 'tabs', 'container', 'tree'])

// ─── Form Renderer Composable ────────────────────────────────
const form = useFormRenderer(props.schema, {
  showErrors: props.showErrorsOn,
  readOnly: props.readOnly,
  disabled: props.disabled,
})

// ─── Provide form context to children ────────────────────────
provide('formRenderer', form)
provide('componentRegistry', registry)

// ─── Performance: debounced emit helper ──────────────────────
let _emitTimer: ReturnType<typeof setTimeout> | null = null
let _isInternalUpdate = false // guard to break bidirectional loop

function debouncedEmit() {
  if (_emitTimer) clearTimeout(_emitTimer)
  _emitTimer = setTimeout(() => {
    _isInternalUpdate = true
    const snapshot = { ...form.formData }
    emit('update:modelValue', snapshot)
    emit('change', snapshot)
    // Reset guard on next tick to allow future external updates
    nextTick(() => { _isInternalUpdate = false })
  }, 60) // 60ms — fast enough to feel instant, slow enough to batch rapid keystrokes
}

// ─── Watch for schema changes (shallow — not deep) ───────────
watch(
  () => props.schema,
  (newSchema) => {
    form.setSchema(newSchema)
  },
)

// ─── Watch for external modelValue changes (guarded) ─────────
watch(
  () => props.modelValue,
  (newVal) => {
    // Guard: skip when the change came from our own emit (breaks the loop)
    if (_isInternalUpdate) return
    if (newVal) {
      form.setSubmission({ data: newVal })
    }
  },
  { deep: true },
)

// ─── Sync formData changes back to parent (debounced) ────────
watch(
  () => form.formData,
  () => {
    debouncedEmit()
  },
  { deep: true },
)

// ─── Methods ─────────────────────────────────────────────────
function handleFieldUpdate(key: string, value: unknown) {
  form.setFieldValue(key, value)
  emit('fieldChange', { key, value })
  // The debounced watcher above handles update:modelValue
}

function handleFieldBlur(key: string) {
  form.handleFieldBlur(key)
}

async function handleSubmit() {
  // Flush any pending debounced emit before submitting
  if (_emitTimer) {
    clearTimeout(_emitTimer)
    _emitTimer = null
  }
  _isInternalUpdate = true
  emit('update:modelValue', { ...form.formData })
  await nextTick()
  _isInternalUpdate = false

  const result = await form.submitForm()

  if (result.success && result.submission) {
    emit('submit', result.submission)
  } else if (result.errors) {
    emit('error', result.errors)
  }
}

function handleReset() {
  form.resetData()
  _isInternalUpdate = true
  emit('update:modelValue', { ...form.formData })
  emit('change', { ...form.formData })
  nextTick(() => { _isInternalUpdate = false })
}

function isLayoutComponent(type: string): boolean {
  return layoutTypes.has(type)
}

const isWizardMode = computed(() => props.schema.display === 'wizard')

// ─── Expose for parent access ────────────────────────────────
defineExpose({
  validate: form.validateAll,
  reset: form.resetData,
  submit: handleSubmit,
  getFormData: () => ({ ...form.formData }),
  isValid: form.isValid,
})
</script>

<template>
  <form
    class="form-renderer"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <!-- ─── Wizard Mode ─────────────────────────────────── -->
    <FormWizard
      v-if="isWizardMode"
      :schema="schema"
      :form-data="form.formData"
      :errors="form.errors"
      :show-errors="form.showErrors"
      :is-submitting="form.isSubmitting"
      :disabled="disabled"
      :read-only="readOnly"
      @update:model-value="(key: string, val: unknown) => handleFieldUpdate(key, val)"
      @blur="(key: string) => handleFieldBlur(key)"
      @submit="handleSubmit"
    >
      <template #renderComponent="{ component: childComp }">
        <component
          v-if="registry.getComponent(childComp.type) && isLayoutComponent(childComp.type)"
          :is="registry.getComponent(childComp.type)"
          :component="form.getOverriddenComponent(childComp)"
          :model-value="form.formData[childComp.key]"
          :errors="form.showErrors ? form.getFieldErrors(childComp.key) : []"
          :disabled="disabled || form.getOverriddenComponent(childComp).disabled || false"
          :read-only="readOnly"
          @update:model-value="(val: unknown) => handleFieldUpdate(childComp.key, val)"
          @blur="handleFieldBlur"
        >
          <template #renderComponent="{ component: nestedComp }">
            <component
              v-if="registry.getComponent(nestedComp.type)"
              :is="registry.getComponent(nestedComp.type)"
              :component="form.getOverriddenComponent(nestedComp)"
              :model-value="form.formData[nestedComp.key]"
              :errors="form.showErrors ? form.getFieldErrors(nestedComp.key) : []"
              :disabled="disabled || form.getOverriddenComponent(nestedComp).disabled || false"
              :read-only="readOnly"
              @update:model-value="(val: unknown) => handleFieldUpdate(nestedComp.key, val)"
              @blur="handleFieldBlur"
            />
          </template>
        </component>
        <component
          v-else-if="registry.getComponent(childComp.type)"
          :is="registry.getComponent(childComp.type)"
          :component="form.getOverriddenComponent(childComp)"
          :model-value="form.formData[childComp.key]"
          :errors="form.showErrors ? form.getFieldErrors(childComp.key) : []"
          :disabled="disabled || form.getOverriddenComponent(childComp).disabled || false"
          :read-only="readOnly"
          @update:model-value="(val: unknown) => handleFieldUpdate(childComp.key, val)"
          @blur="handleFieldBlur"
        />
      </template>
    </FormWizard>

    <!-- ─── Standard Form Mode ──────────────────────────── -->
    <div v-else class="form-renderer__body">
      <template v-for="(comp, index) in schema.components" :key="comp.key || index">
        <!-- Layout components with nested rendering -->
        <component
          v-if="form.isComponentVisible(comp) && registry.getComponent(comp.type) && isLayoutComponent(comp.type)"
          :is="registry.getComponent(comp.type)"
          :component="form.getOverriddenComponent(comp)"
          :model-value="form.formData[comp.key]"
          :errors="form.showErrors ? form.getFieldErrors(comp.key) : []"
          :disabled="disabled || form.getOverriddenComponent(comp).disabled || false"
          :read-only="readOnly"
          @update:model-value="(val: unknown) => handleFieldUpdate(comp.key, val)"
          @blur="handleFieldBlur"
        >
          <template #renderComponent="{ component: childComp }">
            <component
              v-if="registry.getComponent(childComp.type)"
              :is="registry.getComponent(childComp.type)"
              :component="form.getOverriddenComponent(childComp)"
              :model-value="form.formData[childComp.key]"
              :errors="form.showErrors ? form.getFieldErrors(childComp.key) : []"
              :disabled="disabled || form.getOverriddenComponent(childComp).disabled || false"
              :read-only="readOnly"
              @update:model-value="(val: unknown) => handleFieldUpdate(childComp.key, val)"
              @blur="handleFieldBlur"
            />
          </template>
        </component>

        <!-- Regular input components -->
        <component
          v-else-if="form.isComponentVisible(comp) && registry.getComponent(comp.type)"
          :is="registry.getComponent(comp.type)"
          :component="form.getOverriddenComponent(comp)"
          :model-value="form.formData[comp.key]"
          :errors="form.showErrors ? form.getFieldErrors(comp.key) : []"
          :disabled="disabled || form.getOverriddenComponent(comp).disabled || false"
          :read-only="readOnly"
          @update:model-value="(val: unknown) => handleFieldUpdate(comp.key, val)"
          @blur="handleFieldBlur"
        />

        <!-- Unknown component fallback -->
        <div
          v-else-if="form.isComponentVisible(comp) && !registry.getComponent(comp.type)"
          class="form-renderer__unknown"
        >
          <span class="form-renderer__unknown-icon">⚠️</span>
          <span>Unknown component type: <code>{{ comp.type }}</code></span>
        </div>
      </template>
    </div>

    <!-- Validation Summary -->
    <Transition name="slide">
      <div v-if="form.showErrors && form.allErrors.length > 0 && !isWizardMode" class="form-renderer__errors">
        <div class="form-renderer__errors-header">
          <span class="form-renderer__errors-icon">⚠️</span>
          <span>{{ form.errorCount }} {{ form.errorCount === 1 ? 'error' : 'errors' }} found</span>
        </div>
        <ul class="form-renderer__errors-list">
          <li v-for="err in form.allErrors" :key="`${err.key}-${err.type}`">
            {{ err.message }}
          </li>
        </ul>
      </div>
    </Transition>

    <!-- Actions (only in standard mode) -->
    <div v-if="!readOnly && !isWizardMode" class="form-renderer__actions">
      <button
        type="submit"
        class="form-renderer__submit"
        :disabled="form.isSubmitting"
      >
        <span v-if="form.isSubmitting" class="form-renderer__spinner" />
        {{ form.isSubmitting ? 'Submitting...' : submitLabel }}
      </button>

      <button
        v-if="showReset"
        type="button"
        class="form-renderer__reset"
        @click="handleReset"
      >
        {{ resetLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.form-renderer {
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-error: #ef4444;
  --color-success: #22c55e;
  --color-text: #111827;
  --color-label: #374151;
  --color-description: #6b7280;
  --color-placeholder: #9ca3af;
  --color-border: #d1d5db;
  --color-input-bg: #ffffff;
  --color-disabled-bg: #f3f4f6;
  --color-hover: #f3f4f6;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 100%;
}

.form-renderer__body {
  display: flex;
  flex-direction: column;
}

.form-renderer__unknown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #92400e;
  margin-bottom: 1.25rem;
}

.form-renderer__unknown code {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
}

.form-renderer__errors {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1.25rem;
}

.form-renderer__errors-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #991b1b;
  margin-bottom: 0.5rem;
}

.form-renderer__errors-list {
  margin: 0;
  padding-left: 1.875rem;
  font-size: 0.8125rem;
  color: #b91c1c;
}

.form-renderer__errors-list li {
  margin-bottom: 0.25rem;
}

.form-renderer__actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.form-renderer__submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: var(--color-primary);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-renderer__submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.form-renderer__submit:active:not(:disabled) {
  transform: translateY(0);
}

.form-renderer__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-renderer__reset {
  padding: 0.6875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-renderer__reset:hover {
  background: var(--color-hover);
  border-color: #9ca3af;
}

.form-renderer__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
