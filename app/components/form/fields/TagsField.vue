<script setup lang="ts">
/**
 * TagsField Component
 * Tag/chip input — type text, press Enter/comma to add tags.
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
const inputText = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const delimiter = computed(() => (props.component.delimeter as string) || ',')

const tags = computed(() => {
  const val = props.modelValue as string
  if (!val) return []
  return val.split(delimiter.value).map(t => t.trim()).filter(Boolean)
})

function addTag() {
  const text = inputText.value.trim()
  if (!text || props.disabled || props.readOnly) return
  if (tags.value.includes(text)) {
    inputText.value = ''
    return
  }
  const newTags = [...tags.value, text]
  emit('update:modelValue', newTags.join(`${delimiter.value} `))
  inputText.value = ''
}

function removeTag(index: number) {
  if (props.disabled || props.readOnly) return
  const newTags = [...tags.value]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags.join(`${delimiter.value} `))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === delimiter.value) {
    e.preventDefault()
    addTag()
  }
  if (e.key === 'Backspace' && !inputText.value && tags.value.length) {
    removeTag(tags.value.length - 1)
  }
}

function handleBlur() {
  if (inputText.value.trim()) addTag()
  emit('blur', props.component.key)
}

function focusInput() {
  inputEl.value?.focus()
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label" @click="focusInput">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="tags-field__container" :class="{ 'tags-field__container--focused': false }" @click="focusInput">
      <span
        v-for="(tag, idx) in tags"
        :key="`${tag}-${idx}`"
        class="tags-field__tag"
      >
        {{ tag }}
        <button
          v-if="!disabled && !readOnly"
          type="button"
          class="tags-field__tag-remove"
          @click.stop="removeTag(idx)"
        >×</button>
      </span>
      <input
        ref="inputEl"
        v-model="inputText"
        type="text"
        class="tags-field__input"
        :placeholder="tags.length === 0 ? (component.placeholder || 'Type and press Enter…') : ''"
        :disabled="disabled || readOnly"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
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
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; letter-spacing: -0.01em; cursor: pointer; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }

.tags-field__container {
  display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center;
  min-height: 2.625rem; padding: 0.375rem 0.75rem;
  background: var(--color-input-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  cursor: text;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.tags-field__container:focus-within {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.tags-field__tag {
  display: inline-flex; align-items: center; gap: 0.25rem;
  background: var(--color-primary, #6366f1);
  color: white;
  font-size: 0.75rem; font-weight: 500;
  padding: 0.1875rem 0.5rem;
  border-radius: 1rem;
  line-height: 1.4;
  animation: tagIn 0.15s ease;
}

.tags-field__tag-remove {
  background: none; border: none; color: rgba(255,255,255,0.8);
  cursor: pointer; font-size: 0.875rem; line-height: 1; padding: 0 0.125rem;
  font-weight: 700;
}
.tags-field__tag-remove:hover { color: white; }

.tags-field__input {
  flex: 1; min-width: 80px; border: none; outline: none; background: transparent;
  font-size: 0.875rem; color: var(--color-text, #111827); padding: 0.25rem 0;
}
.tags-field__input::placeholder { color: var(--color-placeholder, #9ca3af); }

.has-error .tags-field__container { border-color: var(--color-error, #ef4444); }
.has-error .tags-field__container:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }

.is-disabled .tags-field__container { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }

@keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
