<script setup lang="ts">
/**
 * FieldsetField Component
 * Grouped fieldset with legend wrapper.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
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

const children = computed(() => (props.component.components as FormComponentSchema[]) || [])
</script>

<template>
  <Fieldset
    :legend="component.legend || component.label"
    :class="[component.customClass, 'mb-5']"
  >
    <template v-for="(child, idx) in children" :key="child.key || idx">
      <slot name="renderComponent" :component="child" />
    </template>
  </Fieldset>
</template>

<style scoped>
</style>
