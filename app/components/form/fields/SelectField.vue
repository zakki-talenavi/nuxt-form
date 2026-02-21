<script setup lang="ts">
/**
 * SelectField Component
 * Dropdown select with support for static values,
 * multiple selection, and search.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { FormComponentSchema, ValidationError, SelectValue } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'blur': [key: string]
}>()

const selectedValue = computed({
  get: () => {
    if (props.component.multiple) {
      return Array.isArray(props.modelValue) ? props.modelValue as string[] : []
    }
    return (props.modelValue as string) ?? ''
  },
  set: (val: string | string[]) => emit('update:modelValue', val),
})

const options = computed<SelectValue[]>(() => {
  const data = props.component.data
  if (!data) return []
  return data.values ?? []
})

const hasErrors = computed(() => props.errors.length > 0)

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div
    ref="selectRef"
    class="form-field"
    :class="{ 'has-error': hasErrors, 'is-disabled': disabled }"
  >
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

    <MultiSelect
      v-if="component.multiple"
      :id="`field-${component.key}`"
      v-model="selectedValue"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="component.placeholder || 'Select options...'"
      :filter="options.length > 5"
      :disabled="disabled || readOnly"
      :invalid="hasErrors"
      class="w-full"
      @blur="handleBlur"
    />
    <Select
      v-else
      :id="`field-${component.key}`"
      v-model="selectedValue"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="component.placeholder || 'Select an option...'"
      :filter="options.length > 5"
      :disabled="disabled || readOnly"
      :invalid="hasErrors"
      showClear
      class="w-full"
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
  position: relative;
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

</style>
