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
            <div v-if="!readOnly && !disabled" class="editgrid-row__actions flex gap-2">
              <Button severity="secondary" text class="px-3" @click="editRow(index)">
                <span class="mr-1">✎</span> Edit
              </Button>
              <Button severity="danger" text class="px-3" @click="removeRow(index)">
                <span class="mr-1">✕</span> Remove
              </Button>
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
              <InputText
                v-if="!col.type || col.type === 'textfield' || col.type === 'email' || col.type === 'url'"
                :type="col.type === 'email' ? 'email' : col.type === 'url' ? 'url' : 'text'"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="w-full"
                @input="updateField(index, col.key, ($event.target as HTMLInputElement).value)"
              />
              <InputNumber
                v-else-if="col.type === 'number'"
                :modelValue="(row.data[col.key] as number) ?? null"
                :placeholder="col.placeholder || ''"
                class="w-full"
                @update:modelValue="updateField(index, col.key, $event)"
              />
              <Select
                v-else-if="col.type === 'select'"
                :modelValue="row.data[col.key]"
                :options="col.data?.values ?? []"
                optionLabel="label"
                optionValue="value"
                placeholder="— Select —"
                class="w-full"
                @update:modelValue="updateField(index, col.key, $event)"
              />
              <Textarea
                v-else-if="col.type === 'textarea'"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="w-full"
                rows="2"
                autoResize
                @input="updateField(index, col.key, ($event.target as HTMLTextAreaElement).value)"
              />
              <InputText
                v-else
                type="text"
                :value="(row.data[col.key] as string) ?? ''"
                :placeholder="col.placeholder || ''"
                class="w-full"
                @input="updateField(index, col.key, ($event.target as HTMLInputElement).value)"
              />
            </div>

            <div class="editgrid-editor-actions flex gap-2 mt-3">
              <Button @click="saveRow(index)">✓ Save</Button>
              <Button severity="secondary" outlined @click="cancelRow(index)">✕ Cancel</Button>
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
    <Button
      v-if="!readOnly && !disabled"
      severity="secondary"
      outlined
      class="mt-3"
      @click="addRow"
    >
      <span class="mr-2 font-bold">+</span>
      {{ (component as Record<string, unknown>).addAnother as string || 'Add Another' }}
    </Button>

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

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
