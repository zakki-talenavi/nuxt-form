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
  <fieldset class="fieldset-field" :class="[component.customClass]" :disabled="disabled">
    <legend v-if="component.legend || component.label" class="fieldset-field__legend">
      {{ component.legend || component.label }}
    </legend>
    <div class="fieldset-field__body">
      <template v-for="(child, idx) in children" :key="child.key || idx">
        <slot name="renderComponent" :component="child" />
      </template>
    </div>
  </fieldset>
</template>

<style scoped>
.fieldset-field {
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  background: transparent;
}

.fieldset-field__legend {
  font-weight: 600; font-size: 0.9375rem;
  color: var(--color-label, #374151);
  padding: 0 0.5rem;
}

.fieldset-field__body { display: flex; flex-direction: column; }
</style>
