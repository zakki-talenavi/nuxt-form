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

const inputValue = computed({
  get: () => {
    const v = props.modelValue as number | string | null | undefined
    if (v === '' || v == null) return null
    return Number(v)
  },
  set: (val: number | null) => emit('update:modelValue', val),
})

const isInteger = computed(() => props.component.validate?.integer || false)
const step = computed(() => {
  if (isInteger.value) return 1
  const s = props.component.step as number | undefined
  return s ?? (props.component.validate as Record<string, unknown>)?.step ?? undefined
})
const min = computed(() => props.component.validate?.min as number | undefined)
const max = computed(() => props.component.validate?.max as number | undefined)
const decimalLimit = computed(() => (props.component.decimalLimit as number) ?? 2)
const hasErrors = computed(() => props.errors.length > 0)

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div 
    class="form-field" 
    :class="[
      { 'has-error': hasErrors, 'is-disabled': disabled },
      `label-position-${component.labelPosition || 'top'}`
    ]"
  >
    <!-- Label (Top, Left-Left, Left-Right) -->
    <label
      v-if="component.label && ['top', 'left-left', 'left-right'].includes(component.labelPosition || 'top')"
      :for="`field-${component.key}`"
      class="form-field__label"
      v-tooltip="component.tooltip ? { value: component.tooltip, showDelay: 200 } : undefined"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
      <i v-if="component.tooltip" class="pi pi-question-circle text-xs ml-1 text-slate-400 cursor-help"></i>
    </label>

    <div class="form-field__wrapper">
      <p v-if="component.description" class="form-field__description">
        {{ component.description }}
      </p>

      <InputGroup>
        <InputGroupAddon v-if="component.prefix">
          {{ component.prefix }}
        </InputGroupAddon>
        
        <InputNumber
          :id="`field-${component.key}`"
          v-model="inputValue"
          :placeholder="component.placeholder || ''"
          :disabled="disabled || readOnly"
          :invalid="hasErrors"
          :min="min"
          :max="max"
          :step="step"
          :readonly="readOnly"
          :minFractionDigits="component.requireDecimal ? decimalLimit : 0"
          :maxFractionDigits="isInteger ? 0 : decimalLimit"
          :useGrouping="false"
          :class="['w-full', component.customClass]"
          @blur="handleBlur"
        />

        <InputGroupAddon v-if="component.suffix">
          {{ component.suffix }}
        </InputGroupAddon>
      </InputGroup>

      <div v-if="hasErrors" class="form-field__errors">
        <p v-for="error in errors" :key="error.type" class="form-field__error">
          {{ error.message }}
        </p>
      </div>
    </div>

    <!-- Label (Bottom, Right-Left, Right-Right) -->
    <label
      v-if="component.label && ['bottom', 'right-left', 'right-right'].includes(component.labelPosition || 'top')"
      :for="`field-${component.key}`"
      class="form-field__label"
      v-tooltip="component.tooltip ? { value: component.tooltip, showDelay: 200 } : undefined"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
      <i v-if="component.tooltip" class="pi pi-question-circle text-xs ml-1 text-slate-400 cursor-help"></i>
    </label>
  </div>
</template>

<style scoped>
.form-field { margin-bottom: 1.25rem; display: flex; flex-direction: column; }
.form-field.label-position-bottom { flex-direction: column-reverse; }
.form-field.label-position-bottom .form-field__label { margin-bottom: 0; margin-top: 0.375rem; }
.form-field.label-position-left-left, .form-field.label-position-left-right, .form-field.label-position-right-left, .form-field.label-position-right-right { flex-direction: row; align-items: flex-start; gap: 1rem; }
.form-field.label-position-right-left, .form-field.label-position-right-right { flex-direction: row-reverse; }
.form-field.label-position-left-left .form-field__label, .form-field.label-position-right-left .form-field__label { text-align: left; flex: 0 0 30%; margin-bottom: 0; padding-top: 0.625rem; }
.form-field.label-position-left-right .form-field__label, .form-field.label-position-right-right .form-field__label { text-align: right; flex: 0 0 30%; margin-bottom: 0; padding-top: 0.625rem; }
.form-field__wrapper { flex: 1; min-width: 0; }
.form-field__label { display: flex; align-items: center; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; letter-spacing: -0.01em; }
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
