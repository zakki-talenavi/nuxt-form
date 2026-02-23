<script setup lang="ts">
/**
 * PanelField Component
 * Collapsible card/panel with title header.
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

const isCollapsed = ref(props.component.collapsed as boolean || false)
const collapsible = computed(() => (props.component.collapsible as boolean) !== false)
const children = computed(() => (props.component.components as FormComponentSchema[]) || [])
const theme = computed(() => (props.component.theme as string) || 'default')

function toggleCollapse() {
  if (!collapsible.value) return
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <Panel
    :header="component.title || component.label || 'Panel'"
    :toggleable="collapsible"
    v-model:collapsed="isCollapsed"
    :class="[`panel-theme-${theme}`, component.customClass, 'mb-5']"
  >
    <slot name="renderZone" :list="children">
      <template v-for="(child, idx) in children" :key="child.key || idx">
        <slot name="renderComponent" :component="child" />
      </template>
    </slot>
  </Panel>
</template>

<style scoped>
.panel-theme-primary :deep(.p-panel-header) { background: var(--color-primary, #6366f1); color: white; }
.panel-theme-success :deep(.p-panel-header) { background: #10b981; color: white; }
.panel-theme-danger :deep(.p-panel-header) { background: #ef4444; color: white; }
.panel-theme-warning :deep(.p-panel-header) { background: #f59e0b; color: white; }
.panel-theme-info :deep(.p-panel-header) { background: #3b82f6; color: white; }
</style>
