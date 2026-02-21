<script setup lang="ts">
/**
 * NumberField Component
 * Numeric input with step, min/max, integer validation, and formatting.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'blur': [key: string]
}>()

const displayValue = ref('')

const isInteger = computed(() => props.component.validate?.integer || false)
const step = computed(() => {
  if (isInteger.value) return 1
  const s = props.component.step as number | undefined
  return s ?? (props.component.validate as Record<string, unknown>)?.step ?? 'any'
})
const min = computed(() => props.component.validate?.min)
const max = computed(() => props.component.validate?.max)
const decimalLimit = computed(() => (props.component.decimalLimit as number) ?? 2)
const hasErrors = computed(() => props.errors.length > 0)

// Sync external modelValue → displayValue
watch(
  () => props.modelValue,
  (val) => {
    if (val === null || val === undefined || val === '') {
      displayValue.value = ''
    } else {
      displayValue.value = String(val)
    }
  },
  { immediate: true },
)

function parseInput(raw: string): number | null {
  if (!raw || raw === '-') return null
  const cleaned = raw.replace(/[^0-9.\-]/g, '')
  const num = isInteger.value ? parseInt(cleaned, 10) : parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  displayValue.value = target.value
  emit('update:modelValue', parseInput(target.value))
}

function handleBlur() {
  // Format on blur
  const num = parseInput(displayValue.value)
  if (num !== null) {
    if (isInteger.value) {
      displayValue.value = String(Math.round(num))
    } else if (props.component.requireDecimal) {
      displayValue.value = num.toFixed(decimalLimit.value)
    } else {
      displayValue.value = String(num)
    }
  }
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label
      v-if="component.label"
      :for="`field-${component.key}`"
      class="form-field__label"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <input
      :id="`field-${component.key}`"
      :value="displayValue"
      type="number"
      :placeholder="component.placeholder || ''"
      :disabled="disabled || readOnly"
      :readonly="readOnly"
      :required="component.validate?.required"
      :min="min"
      :max="max"
      :step="step"
      :class="['form-field__input', component.customClass]"
      autocomplete="off"
      inputmode="decimal"
      @input="handleInput"
      @blur="handleBlur"
    />

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-field { margin-bottom: 1.25rem; }
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; letter-spacing: -0.01em; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }
.form-field__input { width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; line-height: 1.5; color: var(--color-text, #111827); background: var(--color-input-bg, #ffffff); border: 1.5px solid var(--color-border, #d1d5db); border-radius: 0.5rem; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-sizing: border-box; }
.form-field__input:focus { border-color: var(--color-primary, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.form-field__input::placeholder { color: var(--color-placeholder, #9ca3af); }
.form-field__input:disabled { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }
.has-error .form-field__input { border-color: var(--color-error, #ef4444); }
.has-error .form-field__input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }

/* Hide number spinner */
.form-field__input[type="number"]::-webkit-inner-spin-button,
.form-field__input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.form-field__input[type="number"] { -moz-appearance: textfield; }
</style>
