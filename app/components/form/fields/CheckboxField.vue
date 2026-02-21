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
      <Checkbox
        :inputId="`field-${component.key}`"
        v-model="isChecked"
        :binary="true"
        :disabled="disabled || readOnly"
        :invalid="hasErrors"
        @blur="handleBlur"
      />
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
