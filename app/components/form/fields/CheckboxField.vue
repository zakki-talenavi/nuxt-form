<script setup lang="ts">
/**
 * CheckboxField Component
 * Toggle checkbox with label support.
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
  'update:modelValue': [value: boolean]
  'blur': [key: string]
}>()

const isChecked = computed({
  get: () => Boolean(props.modelValue),
  set: (val: boolean) => emit('update:modelValue', val),
})

const hasErrors = computed(() => props.errors.length > 0)

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field form-field--checkbox" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label :for="`field-${component.key}`" class="checkbox-label">
      <input
        :id="`field-${component.key}`"
        v-model="isChecked"
        type="checkbox"
        :disabled="disabled || readOnly"
        :required="component.validate?.required"
        class="checkbox-input"
        @blur="handleBlur"
      />
      <span class="checkbox-visual">
        <svg
          class="checkbox-icon"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="checkbox-text">
        {{ component.label }}
        <span v-if="component.validate?.required" class="form-field__required">*</span>
      </span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-field--checkbox {
  margin-bottom: 1.25rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
  user-select: none;
}

.is-disabled .checkbox-label {
  cursor: not-allowed;
  opacity: 0.7;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.checkbox-visual {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.3125rem;
  background: var(--color-input-bg, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-top: 0.0625rem;
}

.checkbox-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: #ffffff;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.15s ease;
}

.checkbox-input:checked + .checkbox-visual {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
}

.checkbox-input:checked + .checkbox-visual .checkbox-icon {
  opacity: 1;
  transform: scale(1);
}

.checkbox-input:focus-visible + .checkbox-visual {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.has-error .checkbox-visual {
  border-color: var(--color-error, #ef4444);
}

.checkbox-text {
  font-size: 0.875rem;
  color: var(--color-text, #111827);
  font-weight: 500;
  line-height: 1.4;
}

.form-field__required {
  color: var(--color-error, #ef4444);
  margin-left: 2px;
}

.form-field__description {
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  margin: 0.25rem 0 0 1.875rem;
}

.form-field__errors {
  margin-top: 0.375rem;
  margin-left: 1.875rem;
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
