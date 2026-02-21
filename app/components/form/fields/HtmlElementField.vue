<script setup lang="ts">
/**
 * HtmlElementField Component
 * Renders a raw HTML element with configurable tag, attrs, and content.
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

const tag = computed(() => (props.component.tag as string) || 'div')
const content = computed(() => (props.component.content as string) || '')
const className = computed(() => (props.component.className as string) || '')
const attrs = computed(() => (props.component.attrs as Array<{ attr: string; value: string }>) || [])

const computedAttrs = computed(() => {
  const result: Record<string, string> = {}
  if (className.value) result.class = className.value
  for (const a of attrs.value) {
    result[a.attr] = a.value
  }
  return result
})
</script>

<template>
  <component
    :is="tag"
    v-bind="computedAttrs"
    class="html-element-field"
    v-html="content"
  />
</template>

<style scoped>
.html-element-field { margin-bottom: 1.25rem; }
</style>
