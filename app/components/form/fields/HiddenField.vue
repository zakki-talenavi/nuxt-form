<script setup lang="ts">
/**
 * HiddenField Component
 * Invisible field that carries data via defaultValue.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

defineEmits<{
  'update:modelValue': [value: unknown]
  'blur': [key: string]
}>()
</script>

<template>
  <!-- Hidden field renders nothing visually -->
  <input type="hidden" :name="component.key" :value="String(modelValue ?? '')" />
</template>
