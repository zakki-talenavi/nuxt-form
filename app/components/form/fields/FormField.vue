<script setup lang="ts">
/**
 * Form Component (Nested/Embedded Form)
 * Renders a sub-form within the parent form.
 * Accepts inline component definitions or displays a placeholder
 * for external form references.
 */
import { computed } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'blur': [key: string]
}>()

const formData = computed<Record<string, unknown>>({
  get: () => {
    const val = props.modelValue
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>
      // formio nested form stores in val.data
      if (obj.data && typeof obj.data === 'object') return obj.data as Record<string, unknown>
      return obj
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val),
})

const subComponents = computed<FormComponentSchema[]>(() => {
  return props.component.components ?? []
})

const hasExternalRef = computed(() => {
  const comp = props.component as Record<string, unknown>
  return !!(comp.src || comp.form || comp.path)
})

const formTitle = computed(() => {
  const comp = props.component as Record<string, unknown>
  return comp.title as string || props.component.label || 'Nested Form'
})

const hasErrors = computed(() => props.errors.length > 0)

function updateField(key: string, value: unknown) {
  const newData = { ...formData.value, [key]: value }
  emit('update:modelValue', newData)
}
</script>

<template>
  <div class="form-field nested-form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <!-- External form reference (placeholder) -->
    <template v-if="hasExternalRef && subComponents.length === 0">
      <div class="nested-form-placeholder">
        <div class="nested-form-placeholder__icon">📋</div>
        <h4 class="nested-form-placeholder__title">{{ formTitle }}</h4>
        <p class="nested-form-placeholder__text">
          This is a reference to an external form.
          In production, this would load and render the referenced form dynamically.
        </p>
        <code class="nested-form-placeholder__ref">
          {{ (component as Record<string, unknown>).src || (component as Record<string, unknown>).path || (component as Record<string, unknown>).form }}
        </code>
      </div>
    </template>

    <!-- Inline sub-form with components -->
    <template v-else>
      <div class="nested-form-container">
        <div class="nested-form-header">
          <span class="nested-form-header__icon">📋</span>
          <span class="nested-form-header__title">{{ formTitle }}</span>
        </div>

        <div v-if="component.description" class="nested-form-description">
          {{ component.description }}
        </div>

        <div class="nested-form-fields">
          <div
            v-for="subComp in subComponents"
            :key="subComp.key"
            class="nested-form-field-item"
          >
            <label v-if="subComp.label" class="nested-field-label">
              {{ subComp.label }}
              <span v-if="subComp.validate?.required" class="form-field__required">*</span>
            </label>
            <InputText
              v-if="!subComp.type || subComp.type === 'textfield' || subComp.type === 'email'"
              :type="subComp.type === 'email' ? 'email' : 'text'"
              :value="(formData[subComp.key] as string) ?? ''"
              :placeholder="subComp.placeholder || subComp.label || ''"
              :disabled="disabled || readOnly"
              class="w-full"
              @input="updateField(subComp.key, ($event.target as HTMLInputElement).value)"
            />
            <InputNumber
              v-else-if="subComp.type === 'number'"
              :modelValue="(formData[subComp.key] as number) ?? null"
              :placeholder="subComp.placeholder || ''"
              :disabled="disabled || readOnly"
              class="w-full"
              @update:modelValue="updateField(subComp.key, $event)"
            />
            <Textarea
              v-else-if="subComp.type === 'textarea'"
              :value="(formData[subComp.key] as string) ?? ''"
              :placeholder="subComp.placeholder || ''"
              :disabled="disabled || readOnly"
              class="w-full"
              rows="3"
              autoResize
              @input="updateField(subComp.key, ($event.target as HTMLTextAreaElement).value)"
            />
            <InputText
              v-else
              type="text"
              :value="(formData[subComp.key] as string) ?? ''"
              :placeholder="subComp.placeholder || subComp.label || ''"
              :disabled="disabled || readOnly"
              class="w-full"
              @input="updateField(subComp.key, ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div v-if="subComponents.length === 0" class="nested-form-empty">
            No fields defined in this nested form.
          </div>
        </div>
      </div>
    </template>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.nested-form-field { margin-bottom: 1.25rem; }

.nested-form-container {
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 0.625rem;
  overflow: hidden;
  background: var(--color-input-bg, #ffffff);
}

.nested-form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.04));
  border-bottom: 1.5px solid var(--color-border, #e5e7eb);
}

.nested-form-header__icon { font-size: 1rem; }

.nested-form-header__title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text, #374151);
}

.nested-form-description {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  border-bottom: 1px solid var(--color-border, #f3f4f6);
}

.nested-form-fields {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nested-form-field-item {}

.nested-field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-label, #374151);
  margin-bottom: 0.25rem;
}

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }

.nested-form-empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-placeholder, #9ca3af);
  font-style: italic;
  font-size: 0.8125rem;
}

/* Placeholder for external forms */
.nested-form-placeholder {
  padding: 2rem;
  text-align: center;
  border: 1.5px dashed var(--color-border, #d1d5db);
  border-radius: 0.625rem;
  background: var(--color-hover, #f9fafb);
}

.nested-form-placeholder__icon { font-size: 2rem; margin-bottom: 0.5rem; }

.nested-form-placeholder__title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text, #374151);
  margin: 0 0 0.5rem 0;
}

.nested-form-placeholder__text {
  font-size: 0.8125rem;
  color: var(--color-description, #6b7280);
  margin: 0 0 0.75rem 0;
  max-width: 24rem;
  margin-left: auto;
  margin-right: auto;
}

.nested-form-placeholder__ref {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(99, 102, 241, 0.06);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-primary, #6366f1);
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
