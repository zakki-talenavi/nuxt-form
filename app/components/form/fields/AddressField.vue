<script setup lang="ts">
/**
 * Address Component
 * Manual address entry with structured sub-fields.
 * Supports address1, address2, city, state, country, and zip code.
 */
import { computed } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface AddressData {
  address1?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  zip?: string
}

const addressFields = [
  { key: 'address1', label: 'Address Line 1', placeholder: 'Street address', colSpan: 'full' },
  { key: 'address2', label: 'Address Line 2', placeholder: 'Apartment, suite, etc.', colSpan: 'full' },
  { key: 'city', label: 'City', placeholder: 'City', colSpan: 'half' },
  { key: 'state', label: 'State / Province', placeholder: 'State', colSpan: 'half' },
  { key: 'country', label: 'Country', placeholder: 'Country', colSpan: 'half' },
  { key: 'zip', label: 'Zip / Postal Code', placeholder: 'Zip code', colSpan: 'half' },
]

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AddressData]
  'blur': [key: string]
}>()

const addressData = computed<AddressData>({
  get: () => {
    const val = props.modelValue
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as AddressData
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val),
})

const hasErrors = computed(() => props.errors.length > 0)

function updateField(fieldKey: string, value: string) {
  const newData = { ...addressData.value, [fieldKey]: value }
  emit('update:modelValue', newData)
}

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field address-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="address-grid">
      <div
        v-for="field in addressFields"
        :key="field.key"
        class="address-item"
        :class="{
          'address-item--full': field.colSpan === 'full',
          'address-item--half': field.colSpan === 'half',
        }"
      >
        <label class="address-label">{{ field.label }}</label>
        <input
          type="text"
          :value="(addressData as Record<string, string>)[field.key] ?? ''"
          :placeholder="field.placeholder"
          :disabled="disabled || readOnly"
          class="address-input"
          @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          @blur="handleBlur"
        />
      </div>
    </div>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.address-field { margin-bottom: 1.25rem; }

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.5rem;
}

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

.address-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-input-bg, #ffffff);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 0.625rem;
}

.address-item--full { grid-column: 1 / -1; }
.address-item--half { grid-column: span 1; }

@media (max-width: 640px) {
  .address-grid { grid-template-columns: 1fr; }
  .address-item--half { grid-column: span 1; }
}

.address-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-label, #6b7280);
  margin-bottom: 0.25rem;
}

.address-input {
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

.address-input:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.address-input:disabled {
  background: var(--color-disabled-bg, #f9fafb);
  cursor: not-allowed;
  opacity: 0.7;
}

.has-error .address-grid {
  border-color: var(--color-error, #ef4444);
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
