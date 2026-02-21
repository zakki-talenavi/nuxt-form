<script setup lang="ts">
/**
 * SelectBoxesField Component
 * Checkbox group — stores Record<string, boolean>.
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
  'update:modelValue': [value: Record<string, boolean>]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)

const options = computed(() => {
  return (props.component.values as Array<{ label: string; value: string }>) ||
    props.component.data?.values || []
})

const isInline = computed(() => (props.component.inline as boolean) || false)

const checkedValues = computed(() => {
  const val = props.modelValue as Record<string, boolean> | undefined
  return val && typeof val === 'object' ? val : {}
})

function toggle(key: string, val: boolean) {
  if (props.disabled || props.readOnly) return
  const current = { ...checkedValues.value }
  current[key] = val
  emit('update:modelValue', current)
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

    <div class="selectboxes-group" :class="{ 'selectboxes-group--inline': isInline }">
      <label
        v-for="opt in options"
        :key="opt.value"
        class="selectbox-option pt-1"
      >
        <Checkbox
          :inputId="`field-${component.key}-${opt.value}`"
          :binary="true"
          :modelValue="checkedValues[opt.value] || false"
          :disabled="disabled || readOnly"
          @update:modelValue="(val) => toggle(opt.value, val)"
          @blur="handleBlur"
        />
        <span class="selectbox-option__label">{{ opt.label }}</span>
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

.selectboxes-group { display: flex; flex-direction: column; gap: 0.5rem; }
.selectboxes-group--inline { flex-direction: row; flex-wrap: wrap; gap: 1rem; }

.selectbox-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
.selectbox-option:hover { opacity: 0.85; }
.selectbox-option__label { font-size: 0.875rem; color: var(--color-text, #111827); line-height: 1.4; }
.is-disabled .selectbox-option { cursor: not-allowed; opacity: 0.6; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
