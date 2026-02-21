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

const inputValue = computed({
  get: () => (props.modelValue as string) ?? '',
  set: (val: string) => emit('update:modelValue', val),
})

const hasErrors = computed(() => props.errors.length > 0)
const rows = computed(() => (props.component.rows as number) ?? 3)

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
        
        <Textarea
          :id="`field-${component.key}`"
          v-model="inputValue"
          :placeholder="component.placeholder || ''"
          :disabled="disabled || readOnly"
          :readonly="readOnly"
          :required="component.validate?.required"
          :invalid="hasErrors"
          :rows="rows"
          :autoResize="component.autoExpand !== false"
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
.form-field {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

/* ─── Label Positioning ─── */
.form-field.label-position-bottom {
  flex-direction: column-reverse;
}
.form-field.label-position-bottom .form-field__label {
  margin-bottom: 0;
  margin-top: 0.375rem;
}

.form-field.label-position-left-left,
.form-field.label-position-left-right,
.form-field.label-position-right-left,
.form-field.label-position-right-right {
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
}

.form-field.label-position-right-left,
.form-field.label-position-right-right {
  flex-direction: row-reverse;
}

.form-field.label-position-left-left .form-field__label,
.form-field.label-position-right-left .form-field__label {
  text-align: left;
  flex: 0 0 30%;
  margin-bottom: 0;
  padding-top: 0.625rem;
}

.form-field.label-position-left-right .form-field__label,
.form-field.label-position-right-right .form-field__label {
  text-align: right;
  flex: 0 0 30%;
  margin-bottom: 0;
  padding-top: 0.625rem;
}

.form-field__wrapper {
  flex: 1;
  min-width: 0;
}

/* ─── Standard Element Styling ─── */
.form-field__label {
  display: flex;
  align-items: center;
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
