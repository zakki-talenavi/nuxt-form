<script setup lang="ts">
/**
 * ContainerField Component
 * Invisible wrapper — scopes nested data under component.key.
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
  <div class="container-field" :class="[component.customClass]">
    <label v-if="component.label" class="container-field__label">
      {{ component.label }}
    </label>
    <div class="container-field__body">
        <slot name="renderZone" :list="children">
          <template v-for="(child, idx) in children" :key="child.key || idx">
            <slot name="renderComponent" :component="child" />
          </template>
        </slot>
    </div>
  </div>
</template>

<style scoped>
.container-field { margin-bottom: 1.25rem; }
.container-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.5rem; }
.container-field__body { display: flex; flex-direction: column; }
</style>
