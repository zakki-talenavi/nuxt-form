<script setup lang="ts">
/**
 * TimeField Component
 * Native time input, stores HH:mm:ss.
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

const parsedTime = computed({
  get: () => {
    const val = props.modelValue as string
    if (!val) return null
    // val is HH:mm:ss. Create an arbitrary Date and set hours/minutes
    const parts = val.split(':')
    const d = new Date()
    d.setHours(Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0), 0)
    return d
  },
  set: (val: Date | null | Date[]) => {
    if (!val || !(val instanceof Date)) {
      emit('update:modelValue', '')
      return
    }
    const hh = String(val.getHours()).padStart(2, '0')
    const mm = String(val.getMinutes()).padStart(2, '0')
    emit('update:modelValue', `${hh}:${mm}:00`)
  },
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

    <DatePicker
      :id="`field-${component.key}`"
      v-model="parsedTime"
      :disabled="disabled || readOnly"
      :readonly="readOnly"
      :required="component.validate?.required"
      :invalid="hasErrors"
      timeOnly
      hourFormat="24"
      fluid
      :class="component.customClass"
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
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
