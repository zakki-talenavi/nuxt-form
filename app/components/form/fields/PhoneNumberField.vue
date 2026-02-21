<script setup lang="ts">
/**
 * PhoneNumberField Component
 * Phone input with auto-formatting mask.
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

const displayValue = ref('')

const hasErrors = computed(() => props.errors.length > 0)
const mask = computed(() => (props.component.inputMask as string) || '(999) 999-9999')

watch(
  () => props.modelValue,
  (val) => {
    displayValue.value = val ? String(val) : ''
  },
  { immediate: true },
)

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const m = mask.value
  let result = ''
  let digitIdx = 0

  for (let i = 0; i < m.length && digitIdx < digits.length; i++) {
    if (m[i] === '9') {
      result += digits[digitIdx++]
    } else {
      result += m[i]
    }
  }
  return result
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawDigits = target.value.replace(/\D/g, '')
  const formatted = applyMask(rawDigits)
  displayValue.value = formatted
  target.value = formatted
  emit('update:modelValue', rawDigits)
}

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

    <InputText
      :id="`field-${component.key}`"
      :value="displayValue"
      type="tel"
      :placeholder="component.placeholder || mask"
      :disabled="disabled || readOnly"
      :readonly="readOnly"
      :required="component.validate?.required"
      :invalid="hasErrors"
      :class="['w-full', component.customClass]"
      autocomplete="tel"
      inputmode="tel"
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
.form-field__input { width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; line-height: 1.5; color: var(--color-text, #111827); background: var(--color-input-bg, #ffffff); border: 1.5px solid var(--color-border, #d1d5db); border-radius: 0.5rem; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-sizing: border-box; font-variant-numeric: tabular-nums; }
.form-field__input:focus { border-color: var(--color-primary, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.form-field__input::placeholder { color: var(--color-placeholder, #9ca3af); }
.form-field__input:disabled { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }
.has-error .form-field__input { border-color: var(--color-error, #ef4444); }
.has-error .form-field__input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
