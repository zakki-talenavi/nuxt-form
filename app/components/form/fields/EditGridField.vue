<script setup lang="ts">
/**
 * EditGrid Component
 * Inline-editable grid with row states (viewing, editing, new).
 * Rows can be expanded for editing and collapsed to show summary.
 */
import { ref, computed } from 'vue'
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

interface EditRow {
  data: Record<string, unknown>
  state: 'saved' | 'editing' | 'new'
  backup: Record<string, unknown> | null
}

const editRows = ref<EditRow[]>([])

// Initialize rows from modelValue
const rows = computed(() => {
  const val = props.modelValue
  if (Array.isArray(val) && val.length > 0) return val as Record<string, unknown>[]
  return [] as Record<string, unknown>[]
})

// Sync editRows with modelValue
function syncEditRows() {
  editRows.value = rows.value.map((row, i) => {
    if (editRows.value[i]) return editRows.value[i]
    return { data: { ...row }, state: 'saved' as const, backup: null }
  })
}
syncEditRows()

const columns = computed<FormComponentSchema[]>(() => props.component.components ?? [])
const hasErrors = computed(() => props.errors.length > 0)
const openWhenEmpty = computed(() => (props.component as Record<string, unknown>).openWhenEmpty as boolean ?? false)

function getRowSummary(row: Record<string, unknown>): string {
  return columns.value
    .filter(col => col.type !== 'hidden')
    .map(col => {
      const val = row[col.key]
      if (val === undefined || val === null || val === '') return ''
      return `${col.label || col.key}: ${String(val)}`
    })
    .filter(Boolean)
    .join(' | ') || '(empty row)'
}

function addRow() {
  const newRow: EditRow = { data: {}, state: 'new', backup: null }
  editRows.value = [...editRows.value, newRow]
}

function editRow(index: number) {
  editRows.value = editRows.value.map((row, i) => {
    if (i === index) {
      return { ...row, state: 'editing' as const, backup: { ...row.data } }
    }
    return row
  })
}

function saveRow(index: number) {
  const row = editRows.value[index]
  if (!row) return

  editRows.value = editRows.value.map((r, i) => {
    if (i === index) return { ...r, state: 'saved' as const, backup: null }
    return r
  })

  // Emit updated rows
  const allData = editRows.value.map(r => ({ ...r.data }))
  emit('update:modelValue', allData)
}

function cancelRow(index: number) {
  const row = editRows.value[index]
  if (!row) return

  if (row.state === 'new') {
    // Remove unsaved new row
    editRows.value = editRows.value.filter((_, i) => i !== index)
  } else {
    // Restore backup
    editRows.value = editRows.value.map((r, i) => {
      if (i === index && r.backup) {
        return { data: { ...r.backup }, state: 'saved' as const, backup: null }
      }
      return r
    })
  }
}

function removeRow(index: number) {
  editRows.value = editRows.value.filter((_, i) => i !== index)
  const allData = editRows.value.map(r => ({ ...r.data }))
  emit('update:modelValue', allData)
}

function updateField(rowIndex: number, key: string, value: unknown) {
  editRows.value = editRows.value.map((row, i) => {
    if (i === rowIndex) {
      return { ...row, data: { ...row.data, [key]: value } }
    }
    return row
  })
}

function isRowOpen(row: EditRow): boolean {
  return row.state === 'editing' || row.state === 'new'
}
</script>

<template>
  <div class="form-field editgrid-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <!-- Header -->
    <div v-if="editRows.length > 0 || !openWhenEmpty" class="editgrid-header">
      <div
        v-for="col in columns"
        :key="col.key"
        class="editgrid-header__cell"
      >
        {{ col.label || col.key }}
      </div>
      <div v-if="!readOnly && !disabled" class="editgrid-header__cell editgrid-header__cell--actions">
        Actions
      </div>
    </div>

    <!-- Rows -->
    <div class="editgrid-rows">
      <div
        v-for="(row, index) in editRows"
        :key="index"
        class="editgrid-row"
        :class="{ 'is-open': isRowOpen(row) }"
      >
        <!-- Saved row view -->
        <template v-if="!isRowOpen(row)">
          <div class="editgrid-row__summary">
            <span class="editgrid-row__text">{{ getRowSummary(row.data) }}</span>
            <div v-if="!readOnly && !disabled" class="editgrid-row__actions">
              <button type="button" class="editgrid-btn editgrid-btn--edit" @click="editRow(index)">
                ✎ Edit
              </button>
              <button type="button" class="editgrid-btn editgrid-btn--remove" @click="removeRow(index)">
                ✕ Remove
              </button>
            </div>
          </div>
        </template>

        <!-- Editing row -->
        <template v-else>
          <div class="editgrid-row__editor">
            <div
              v-for="col in columns"
              :key="col.key"
              class="editgrid-editor-field"
            >
              <label class="editgrid-editor-label">{{ col.label || col.key }}</label>
              <input
                v-if="!col.type || col.type === 'textfield' || col.type === 'email' || col.type === 'url'"
                :type="col.type === 'email' ? 'email' : col.type === 'url' ? 'url' : 'text'"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="editgrid-editor-input"
                @input="updateField(index, col.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                v-else-if="col.type === 'number'"
                type="number"
                :value="(row.data[col.key] as number) ?? ''"
                :placeholder="col.placeholder || ''"
                class="editgrid-editor-input"
                @input="updateField(index, col.key, Number(($event.target as HTMLInputElement).value))"
              />
              <select
                v-else-if="col.type === 'select'"
                :value="(row.data[col.key] as string) ?? ''"
                class="editgrid-editor-input editgrid-editor-select"
                @change="updateField(index, col.key, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">— Select —</option>
                <option
                  v-for="opt in (col.data?.values ?? [])"
                  :key="String(opt.value)"
                  :value="String(opt.value)"
                >
                  {{ opt.label }}
                </option>
              </select>
              <textarea
                v-else-if="col.type === 'textarea'"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="editgrid-editor-input editgrid-editor-textarea"
                rows="2"
                @input="updateField(index, col.key, ($event.target as HTMLTextAreaElement).value)"
              />
              <input
                v-else
                type="text"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="editgrid-editor-input"
                @input="updateField(index, col.key, ($event.target as HTMLInputElement).value)"
              />
            </div>

            <div class="editgrid-editor-actions">
              <button type="button" class="editgrid-btn editgrid-btn--save" @click="saveRow(index)">
                ✓ Save
              </button>
              <button type="button" class="editgrid-btn editgrid-btn--cancel" @click="cancelRow(index)">
                ✕ Cancel
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="editRows.length === 0 && !openWhenEmpty" class="editgrid-empty">
      No rows added yet.
    </div>

    <!-- Add row button -->
    <button
      v-if="!readOnly && !disabled"
      type="button"
      class="editgrid-add-btn"
      @click="addRow"
    >
      <span class="editgrid-add-icon">+</span>
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
.editgrid-field {
  margin-bottom: 1.25rem;
}

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.5rem;
}

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

.editgrid-header {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-table-header, #f9fafb);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem 0.5rem 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-label, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.editgrid-header__cell { flex: 1; }
.editgrid-header__cell--actions { flex: 0 0 8rem; text-align: right; }

.editgrid-rows {
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  overflow: hidden;
}

.editgrid-row {
  border-bottom: 1px solid var(--color-border, #f3f4f6);
  transition: background 0.15s ease;
}

.editgrid-row:last-child { border-bottom: none; }

.editgrid-row__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  gap: 0.5rem;
}

.editgrid-row:hover .editgrid-row__summary {
  background: var(--color-hover, #f3f4f6);
}

.editgrid-row__text {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--color-text, #374151);
}

.editgrid-row__actions {
  display: flex;
  gap: 0.375rem;
}

.editgrid-row__editor {
  padding: 1rem;
  background: rgba(99, 102, 241, 0.02);
  border-left: 3px solid var(--color-primary, #6366f1);
}

.editgrid-editor-field {
  margin-bottom: 0.75rem;
}

.editgrid-editor-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-label, #374151);
  margin-bottom: 0.25rem;
}

.editgrid-editor-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #111827);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.editgrid-editor-input:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
}

.editgrid-editor-select { appearance: auto; }
.editgrid-editor-textarea { resize: vertical; min-height: 2.5rem; }

.editgrid-editor-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.editgrid-btn {
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.editgrid-btn--edit {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}
.editgrid-btn--edit:hover { background: rgba(99, 102, 241, 0.16); }

.editgrid-btn--remove {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}
.editgrid-btn--remove:hover { background: rgba(239, 68, 68, 0.18); }

.editgrid-btn--save {
  background: var(--color-primary, #6366f1);
  color: #fff;
}
.editgrid-btn--save:hover { opacity: 0.9; }

.editgrid-btn--cancel {
  background: var(--color-border, #e5e7eb);
  color: var(--color-text, #374151);
}
.editgrid-btn--cancel:hover { background: #d1d5db; }

.editgrid-empty {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-placeholder, #9ca3af);
  font-size: 0.8125rem;
  font-style: italic;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
}

.editgrid-add-btn {
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

.editgrid-add-btn:hover { background: rgba(99, 102, 241, 0.12); }
.editgrid-add-icon { font-size: 1rem; font-weight: 700; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
