<script setup lang="ts">
/**
 * TextAreaField Component
 * Multi-line text input with auto-resize support.
 */
import { ref, onMounted, nextTick } from 'vue'
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

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const inputValue = computed({
  get: () => (props.modelValue as string) ?? '',
  set: (val: string) => {
    emit('update:modelValue', val)
    nextTick(() => autoResize())
  },
})

const hasErrors = computed(() => props.errors.length > 0)
const rows = computed(() => (props.component.rows as number) ?? 3)

function autoResize() {
  const el = textareaRef.value
  if (!el || props.component.autoExpand === false) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function handleBlur() {
  emit('blur', props.component.key)
}

onMounted(() => {
  if (inputValue.value) autoResize()
})
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

    <textarea
      :id="`field-${component.key}`"
      ref="textareaRef"
      v-model="inputValue"
      :placeholder="component.placeholder || ''"
      :disabled="disabled || readOnly"
      :readonly="readOnly"
      :required="component.validate?.required"
      :minlength="component.validate?.minLength"
      :maxlength="component.validate?.maxLength"
      :rows="rows"
      :class="['form-field__textarea', component.customClass]"
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
.form-field {
  margin-bottom: 1.25rem;
}

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.375rem;
  letter-spacing: -0.01em;
}

.form-field__required {
  color: var(--color-error, #ef4444);
  margin-left: 2px;
}

.form-field__description {
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  margin: 0 0 0.375rem 0;
}

.form-field__textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  color: var(--color-text, #111827);
  background: var(--color-input-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  resize: vertical;
  min-height: 4rem;
  box-sizing: border-box;
}

.form-field__textarea:focus {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.form-field__textarea::placeholder {
  color: var(--color-placeholder, #9ca3af);
}

.form-field__textarea:disabled {
  background: var(--color-disabled-bg, #f3f4f6);
  cursor: not-allowed;
  opacity: 0.7;
}

.has-error .form-field__textarea {
  border-color: var(--color-error, #ef4444);
}

.has-error .form-field__textarea:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.form-field__errors {
  margin-top: 0.375rem;
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
