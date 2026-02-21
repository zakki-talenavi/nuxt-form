<script setup lang="ts">
/**
 * RadioField Component
 * Radio button group from values array.
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
  'update:modelValue': [value: string | number | boolean]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)

const options = computed(() => {
  const vals = (props.component.values as Array<{ label: string; value: string }>) ||
    props.component.data?.values || []
  return vals
})

const isInline = computed(() => (props.component.inline as boolean) || false)
const selectedValue = computed(() => String(props.modelValue ?? ''))

function selectOption(value: string) {
  if (props.disabled || props.readOnly) return
  // If clicking the already-selected radio, deselect it
  if (selectedValue.value === value) {
    emit('update:modelValue', '' as unknown as string)
  } else {
    emit('update:modelValue', value)
  }
}

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="radio-group" :class="{ 'radio-group--inline': isInline }" role="radiogroup">
      <label
        v-for="opt in options"
        :key="opt.value"
        class="radio-option"
        :class="{ 'radio-option--selected': selectedValue === String(opt.value) }"
      >
        <input
          type="radio"
          :name="`radio-${component.key}`"
          :value="opt.value"
          :checked="selectedValue === String(opt.value)"
          :disabled="disabled || readOnly"
          class="radio-option__input"
          @click="selectOption(String(opt.value))"
          @blur="handleBlur"
        />
        <span class="radio-option__indicator" />
        <span class="radio-option__label">{{ opt.label }}</span>
      </label>
    </div>

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

.radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
.radio-group--inline { flex-direction: row; flex-wrap: wrap; gap: 1rem; }

.radio-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.375rem 0; user-select: none; transition: opacity 0.15s; }
.radio-option:hover { opacity: 0.85; }
.radio-option__input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }

.radio-option__indicator {
  width: 1.125rem; height: 1.125rem;
  border-radius: 50%;
  border: 2px solid var(--color-border, #d1d5db);
  background: var(--color-input-bg, #ffffff);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
}

.radio-option--selected .radio-option__indicator {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary, #6366f1);
}

.radio-option--selected .radio-option__indicator::after {
  content: '';
  width: 0.375rem; height: 0.375rem;
  background: white;
  border-radius: 50%;
  position: absolute;
}

.radio-option__label { font-size: 0.875rem; color: var(--color-text, #111827); }

.radio-option__input:focus-visible + .radio-option__indicator {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.is-disabled .radio-option { cursor: not-allowed; opacity: 0.6; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
