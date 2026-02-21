<script setup lang="ts">
/**
 * ContentField Component
 * Renders static HTML content from the schema's `html` property.
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

const htmlContent = computed(() => (props.component.html as string) || '')
</script>

<template>
  <div
    class="content-field"
    :class="[component.customClass]"
    v-html="htmlContent"
  />
</template>

<style scoped>
.content-field {
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text, #111827);
}

.content-field :deep(h1),
.content-field :deep(h2),
.content-field :deep(h3),
.content-field :deep(h4) { margin: 0.5rem 0; font-weight: 600; }

.content-field :deep(p) { margin: 0.375rem 0; }
.content-field :deep(a) { color: var(--color-primary, #6366f1); text-decoration: underline; }
.content-field :deep(ul), .content-field :deep(ol) { padding-left: 1.5rem; }
</style>
