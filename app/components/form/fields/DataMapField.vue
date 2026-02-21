<script setup lang="ts">
/**
 * DataMap Component
 * Key-value pair editor. Users can add/remove entries.
 * Each row has a key (text input) and a value (configurable type).
 */
import { computed } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'blur': [key: string]
}>()

const mapData = computed<Record<string, unknown>>({
  get: () => {
    const val = props.modelValue
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, unknown>
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val),
})

// Convert object to array of entries for rendering
const entries = computed(() => {
  return Object.entries(mapData.value).map(([key, value]) => ({ key, value }))
})

const hasErrors = computed(() => props.errors.length > 0)

const keyLabel = computed(() =>
  (props.component as Record<string, unknown>).keyLabel as string ?? 'Key'
)

const valueLabel = computed(() => {
  const vc = (props.component as Record<string, unknown>).valueComponent as Record<string, unknown> | undefined
  return vc?.label as string ?? 'Value'
})

function generateUniqueKey(base: string = 'key'): string {
  let newKey = base
  let counter = 1
  while (mapData.value.hasOwnProperty(newKey)) {
    newKey = `${base}${counter}`
    counter++
  }
  return newKey
}

function addEntry() {
  const newKey = generateUniqueKey()
  const newData = { ...mapData.value, [newKey]: '' }
  emit('update:modelValue', newData)
}

function removeEntry(key: string) {
  const newData = { ...mapData.value }
  delete newData[key]
  emit('update:modelValue', newData)
}

function updateKey(oldKey: string, newKey: string) {
  if (!newKey || newKey === oldKey) return
  // Generate unique key if collision
  const finalKey = mapData.value.hasOwnProperty(newKey) && newKey !== oldKey
    ? generateUniqueKey(newKey)
    : newKey

  const newData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(mapData.value)) {
    if (k === oldKey) {
      newData[finalKey] = v
    } else {
      newData[k] = v
    }
  }
  emit('update:modelValue', newData)
}

function updateValue(key: string, value: unknown) {
  const newData = { ...mapData.value, [key]: value }
  emit('update:modelValue', newData)
}
</script>

<template>
  <div class="form-field datamap-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="datamap-table-wrapper">
      <!-- Header -->
      <div class="datamap-header">
        <div class="datamap-header__cell datamap-cell--key">{{ keyLabel }}</div>
        <div class="datamap-header__cell datamap-cell--value">{{ valueLabel }}</div>
        <div v-if="!readOnly && !disabled" class="datamap-header__cell datamap-cell--actions" />
      </div>

      <!-- Entries -->
      <div class="datamap-rows">
        <div
          v-for="entry in entries"
          :key="entry.key"
          class="datamap-row"
        >
          <div class="datamap-cell datamap-cell--key pr-2">
            <InputText
              :value="entry.key"
              :disabled="disabled || readOnly"
              class="w-full"
              placeholder="key"
              @blur="updateKey(entry.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="datamap-cell datamap-cell--value pr-2">
            <InputText
              :value="String(entry.value ?? '')"
              :disabled="disabled || readOnly"
              class="w-full"
              placeholder="value"
              @input="updateValue(entry.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div v-if="!readOnly && !disabled" class="datamap-cell datamap-cell--actions">
            <Button
              severity="danger"
              text
              class="px-2 font-bold"
              aria-label="Remove entry"
              @click="removeEntry(entry.key)"
            >✕</Button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="entries.length === 0" class="datamap-empty">
          No entries yet. Click "Add Another" to start.
        </div>
      </div>
    </div>

    <Button
      v-if="!readOnly && !disabled"
      :label="(component as Record<string, unknown>).addAnother as string || 'Add Another'"
      severity="secondary"
      outlined
      class="mt-3"
      @click="addEntry"
    >
      <template #icon>
        <span class="mr-2 font-bold">+</span>
      </template>
    </Button>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.datamap-field { margin-bottom: 1.25rem; }

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.5rem;
}

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

.datamap-table-wrapper {
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  overflow: hidden;
}

.datamap-header {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-table-header, #f9fafb);
  border-bottom: 1.5px solid var(--color-border, #e5e7eb);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-label, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.datamap-header__cell { flex: 1; }
.datamap-cell--key { flex: 0 0 35%; }
.datamap-cell--value { flex: 1; }
.datamap-cell--actions { flex: 0 0 2.5rem; text-align: center; }

.datamap-rows {
  background: var(--color-input-bg, #ffffff);
}

.datamap-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
  align-items: center;
  transition: background 0.15s ease;
}

.datamap-row:last-child { border-bottom: none; }
.datamap-row:hover { background: var(--color-hover, #f9fafb); }

.datamap-cell {
  display: flex;
  align-items: center;
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
