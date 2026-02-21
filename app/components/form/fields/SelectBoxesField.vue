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

function toggle(key: string) {
  if (props.disabled || props.readOnly) return
  const current = { ...checkedValues.value }
  current[key] = !current[key]
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
        class="selectbox-option"
        :class="{ 'selectbox-option--selected': checkedValues[opt.value] }"
      >
        <input
          type="checkbox"
          :checked="checkedValues[opt.value] || false"
          :disabled="disabled || readOnly"
          class="selectbox-option__input"
          @change="toggle(opt.value)"
          @blur="handleBlur"
        />
        <span class="selectbox-option__indicator">
          <svg v-if="checkedValues[opt.value]" viewBox="0 0 12 12" fill="none" class="selectbox-option__check">
            <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
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

.selectbox-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.375rem 0; user-select: none; }
.selectbox-option:hover { opacity: 0.85; }
.selectbox-option__input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }

.selectbox-option__indicator {
  width: 1.125rem; height: 1.125rem;
  border-radius: 0.25rem;
  border: 2px solid var(--color-border, #d1d5db);
  background: var(--color-input-bg, #ffffff);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.selectbox-option--selected .selectbox-option__indicator {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary, #6366f1);
}

.selectbox-option__check { width: 0.75rem; height: 0.75rem; color: white; }
.selectbox-option__label { font-size: 0.875rem; color: var(--color-text, #111827); }

.selectbox-option__input:focus-visible + .selectbox-option__indicator {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.is-disabled .selectbox-option { cursor: not-allowed; opacity: 0.6; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
