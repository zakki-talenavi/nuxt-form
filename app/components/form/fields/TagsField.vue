<script setup lang="ts">
/**
 * TagsField Component
 * Tag/chip input — type text, press Enter or comma to add tags.
 * Refactored to use PrimeVue v4 <InputChips>.
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
  'update:modelValue': [value: string | string[]]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)
const delimiter = computed(() => (props.component.delimeter as string) || ',')
const storeAs = computed(() => (props.component.storeas as string) || 'string')

const tagsArray = computed({
  get() {
    if (storeAs.value === 'array') {
      return (props.modelValue as string[]) || []
    }
    const val = props.modelValue as string
    if (!val) return []
    return val.split(delimiter.value).map(t => t.trim()).filter(Boolean)
  },
  set(val: string[]) {
    if (storeAs.value === 'array') {
      emit('update:modelValue', val)
    } else {
      emit('update:modelValue', val.join(`${delimiter.value} `))
    }
  }
})

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" :for="`field-${component.key}`" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <!-- PrimeVue InputChips handles all the manual enter/backspace logic -->
    <InputChips
      :id="`field-${component.key}`"
      v-model="tagsArray"
      :placeholder="tagsArray.length === 0 ? (component.placeholder || 'Type and press Enter…') : ''"
      :disabled="disabled || readOnly"
      :invalid="hasErrors"
      :separator="delimiter"
      :class="['w-full', component.customClass]"
      fluid
      @blur="handleBlur"
    />

    <div v-if="hasErrors" class="form-field__errors mt-1">
      <p v-for="error in errors" :key="error.type" class="form-field__error text-xs text-red-500 m-0">
        ⚠ {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-field { margin-bottom: 1.25rem; }
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; letter-spacing: -0.01em; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }
</style>
