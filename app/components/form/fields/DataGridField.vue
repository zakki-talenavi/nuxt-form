<script setup lang="ts">
/**
 * DataGrid Component
 * Repeatable rows in a table layout.
 * Users can add/remove rows, each containing nested form fields.
 */
import { ref, computed, watch } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>[]]
  'blur': [key: string]
}>()

// Rows data — array of objects
const rows = computed({
  get: () => {
    const val = props.modelValue
    if (Array.isArray(val) && val.length > 0) return val as Record<string, unknown>[]
    return [{}] as Record<string, unknown>[]
  },
  set: (val: Record<string, unknown>[]) => emit('update:modelValue', val),
})

// Column definitions from nested components
const columns = computed<FormComponentSchema[]>(() => {
  return props.component.components ?? []
})

const hasErrors = computed(() => props.errors.length > 0)
const minRows = computed(() => (props.component.validate as Record<string, unknown>)?.minLength as number ?? 0)
const maxRows = computed(() => (props.component.validate as Record<string, unknown>)?.maxLength as number ?? 0)

const canAddRow = computed(() => {
  if (props.disabled || props.readOnly) return false
  if (maxRows.value > 0 && rows.value.length >= maxRows.value) return false
  return true
})

const canRemoveRow = computed(() => {
  if (props.disabled || props.readOnly) return false
  if (rows.value.length <= Math.max(minRows.value, 1)) return false
  return true
})

function addRow() {
  const newRows = [...rows.value, {}]
  emit('update:modelValue', newRows)
}

function removeRow(index: number) {
  const newRows = rows.value.filter((_, i) => i !== index)
  emit('update:modelValue', newRows.length > 0 ? newRows : [{}])
}

function updateCell(rowIndex: number, key: string, value: unknown) {
  const newRows = rows.value.map((row, i) => {
    if (i === rowIndex) {
      return { ...row, [key]: value }
    }
    return row
  })
  emit('update:modelValue', newRows)
}
</script>

<template>
  <div class="form-field datagrid-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="datagrid-table-wrapper">
      <table class="datagrid-table">
        <thead>
          <tr>
            <th class="datagrid-th datagrid-th--index">#</th>
            <th
              v-for="col in columns"
              :key="col.key"
              class="datagrid-th"
            >
              {{ col.label || col.key }}
            </th>
            <th v-if="!readOnly && !disabled" class="datagrid-th datagrid-th--actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex" class="datagrid-row">
            <td class="datagrid-td datagrid-td--index">{{ rowIndex + 1 }}</td>
            <td
              v-for="col in columns"
              :key="col.key"
              class="datagrid-td"
            >
              <!-- Simple inline input based on column type -->
              <input
                v-if="!col.type || col.type === 'textfield' || col.type === 'email' || col.type === 'url' || col.type === 'phoneNumber'"
                :type="col.type === 'email' ? 'email' : col.type === 'url' ? 'url' : 'text'"
                :value="(row[col.key] as string) ?? ''"
                :placeholder="col.placeholder || col.label || ''"
                :disabled="disabled || readOnly"
                class="datagrid-input"
                @input="updateCell(rowIndex, col.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                v-else-if="col.type === 'number' || col.type === 'currency'"
                type="number"
                :value="(row[col.key] as number) ?? ''"
                :placeholder="col.placeholder || col.label || ''"
                :disabled="disabled || readOnly"
                class="datagrid-input"
                @input="updateCell(rowIndex, col.key, Number(($event.target as HTMLInputElement).value))"
              />
              <select
                v-else-if="col.type === 'select'"
                :value="(row[col.key] as string) ?? ''"
                :disabled="disabled || readOnly"
                class="datagrid-input datagrid-select"
                @change="updateCell(rowIndex, col.key, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">{{ col.placeholder || '— Select —' }}</option>
                <option
                  v-for="opt in (col.data?.values ?? [])"
                  :key="String(opt.value)"
                  :value="String(opt.value)"
                >
                  {{ opt.label }}
                </option>
              </select>
              <label
                v-else-if="col.type === 'checkbox'"
                class="datagrid-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="Boolean(row[col.key])"
                  :disabled="disabled || readOnly"
                  @change="updateCell(rowIndex, col.key, ($event.target as HTMLInputElement).checked)"
                />
              </label>
              <textarea
                v-else-if="col.type === 'textarea'"
                :value="(row[col.key] as string) ?? ''"
                :placeholder="col.placeholder || col.label || ''"
                :disabled="disabled || readOnly"
                class="datagrid-input datagrid-textarea"
                rows="2"
                @input="updateCell(rowIndex, col.key, ($event.target as HTMLTextAreaElement).value)"
              />
              <!-- Fallback: generic text input -->
              <input
                v-else
                type="text"
                :value="(row[col.key] as string) ?? ''"
                :placeholder="col.placeholder || col.label || ''"
                :disabled="disabled || readOnly"
                class="datagrid-input"
                @input="updateCell(rowIndex, col.key, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td v-if="!readOnly && !disabled" class="datagrid-td datagrid-td--actions">
              <button
                v-if="canRemoveRow"
                type="button"
                class="datagrid-btn datagrid-btn--remove"
                title="Remove row"
                @click="removeRow(rowIndex)"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      v-if="canAddRow"
      type="button"
      class="datagrid-add-btn"
      @click="addRow"
    >
      <span class="datagrid-add-icon">+</span>
      {{ (component as Record<string, unknown>).addAnother as string || 'Add Another' }}
    </button>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.datagrid-field {
  margin-bottom: 1.25rem;
}

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.form-field__required {
  color: var(--color-error, #ef4444);
  margin-left: 2px;
}

.form-field__description {
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  margin: 0 0 0.5rem 0;
}

.datagrid-table-wrapper {
  overflow-x: auto;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  background: var(--color-input-bg, #ffffff);
}

.datagrid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.datagrid-th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--color-label, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-table-header, #f9fafb);
  border-bottom: 1.5px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}

.datagrid-th--index {
  width: 2.5rem;
  text-align: center;
}

.datagrid-th--actions {
  width: 4rem;
  text-align: center;
}

.datagrid-row {
  transition: background 0.15s ease;
}

.datagrid-row:hover {
  background: var(--color-hover, #f3f4f6);
}

.datagrid-td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
  vertical-align: middle;
}

.datagrid-td--index {
  text-align: center;
  color: var(--color-placeholder, #9ca3af);
  font-size: 0.75rem;
  font-weight: 500;
}

.datagrid-td--actions {
  text-align: center;
}

.datagrid-input {
  width: 100%;
  padding: 0.4375rem 0.625rem;
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #111827);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.datagrid-input:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
}

.datagrid-input:disabled {
  background: var(--color-disabled-bg, #f9fafb);
  cursor: not-allowed;
  opacity: 0.7;
}

.datagrid-select {
  appearance: auto;
}

.datagrid-textarea {
  resize: vertical;
  min-height: 2.25rem;
}

.datagrid-checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.datagrid-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary, #6366f1);
}

.datagrid-btn {
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}

.datagrid-btn--remove {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.datagrid-btn--remove:hover {
  background: rgba(239, 68, 68, 0.18);
}

.datagrid-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.06);
  border: 1.5px dashed var(--color-primary, #6366f1);
  border-radius: 0.5rem;
  color: var(--color-primary, #6366f1);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.datagrid-add-btn:hover {
  background: rgba(99, 102, 241, 0.12);
}

.datagrid-add-icon {
  font-size: 1rem;
  font-weight: 700;
}

.form-field__errors {
  margin-top: 0.375rem;
}

.form-field__error {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-field__error::before {
  content: '⚠';
  font-size: 0.625rem;
}
</style>
