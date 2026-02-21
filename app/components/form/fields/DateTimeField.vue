<script setup lang="ts">
/**
 * DateTimeField Component
 * Date and/or time picker using native browser inputs.
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
  'update:modelValue': [value: string]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)
const enableDate = computed(() => (props.component.enableDate as boolean) !== false)
const enableTime = computed(() => (props.component.enableTime as boolean) !== false)

const inputType = computed(() => {
  if (enableDate.value && enableTime.value) return 'datetime-local'
  if (enableDate.value) return 'date'
  return 'time'
})

// Convert ISO string ↔ native input value
const inputValue = computed({
  get: () => {
    const val = props.modelValue as string
    if (!val) return ''
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return val
      if (inputType.value === 'datetime-local') {
        return d.toISOString().slice(0, 16)
      }
      if (inputType.value === 'date') {
        return d.toISOString().slice(0, 10)
      }
      return d.toISOString().slice(11, 16)
    } catch {
      return val
    }
  },
  set: (val: string) => {
    if (!val) {
      emit('update:modelValue', '')
      return
    }
    try {
      const d = new Date(val)
      emit('update:modelValue', isNaN(d.getTime()) ? val : d.toISOString())
    } catch {
      emit('update:modelValue', val)
    }
  },
})

const minDate = computed(() => {
  const dp = props.component.datePicker as Record<string, unknown> | undefined
  return dp?.minDate ? String(dp.minDate).slice(0, inputType.value === 'date' ? 10 : 16) : undefined
})

const maxDate = computed(() => {
  const dp = props.component.datePicker as Record<string, unknown> | undefined
  return dp?.maxDate ? String(dp.maxDate).slice(0, inputType.value === 'date' ? 10 : 16) : undefined
})

function handleBlur() {
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
      v-model="inputValue"
      :type="inputType"
      :disabled="disabled || readOnly"
      :readonly="readOnly"
      :required="component.validate?.required"
      :min="minDate"
      :max="maxDate"
      :class="['form-field__input', component.customClass]"
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
.form-field__input:disabled { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }
.has-error .form-field__input { border-color: var(--color-error, #ef4444); }
.has-error .form-field__input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
