<script setup lang="ts">
/**
 * WellField Component
 * Simple visual container (bordered box).
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
  <div class="well-field" :class="[component.customClass]">
    <slot name="renderZone" :list="children">
      <template v-for="(child, idx) in children" :key="child.key || idx">
        <slot name="renderComponent" :component="child" />
      </template>
    </slot>
  </div>
</template>

<style scoped>
.well-field {
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  background: var(--color-hover, #f9fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
}
</style>
