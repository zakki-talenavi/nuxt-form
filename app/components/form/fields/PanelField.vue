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
  <div class="panel-field" :class="[`panel-field--${theme}`, component.customClass]">
    <div
      class="panel-field__header"
      :class="{ 'panel-field__header--clickable': collapsible }"
      @click="toggleCollapse"
    >
      <h4 class="panel-field__title">{{ component.title || component.label || 'Panel' }}</h4>
      <span v-if="collapsible" class="panel-field__toggle" :class="{ 'panel-field__toggle--collapsed': isCollapsed }">
        ▼
      </span>
    </div>
    <Transition name="panel-collapse">
      <div v-show="!isCollapsed" class="panel-field__body">
        <template v-for="(child, idx) in children" :key="child.key || idx">
          <slot name="renderComponent" :component="child" />
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-field {
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;
  overflow: hidden;
  background: var(--color-input-bg, #ffffff);
}

.panel-field--primary { border-color: var(--color-primary, #6366f1); }
.panel-field--primary .panel-field__header { background: var(--color-primary, #6366f1); color: white; }
.panel-field--success { border-color: #10b981; }
.panel-field--success .panel-field__header { background: #10b981; color: white; }
.panel-field--danger { border-color: #ef4444; }
.panel-field--danger .panel-field__header { background: #ef4444; color: white; }
.panel-field--warning { border-color: #f59e0b; }
.panel-field--warning .panel-field__header { background: #f59e0b; color: white; }
.panel-field--info { border-color: #3b82f6; }
.panel-field--info .panel-field__header { background: #3b82f6; color: white; }

.panel-field__header {
  padding: 0.75rem 1rem;
  display: flex; align-items: center; justify-content: space-between;
  background: var(--color-hover, #f9fafb);
  user-select: none;
}

.panel-field__header--clickable { cursor: pointer; }
.panel-field__header--clickable:hover { opacity: 0.9; }

.panel-field__title { margin: 0; font-size: 0.9375rem; font-weight: 600; }

.panel-field__toggle {
  font-size: 0.625rem; transition: transform 0.25s ease;
}
.panel-field__toggle--collapsed { transform: rotate(-90deg); }

.panel-field__body { padding: 1.25rem; }

.panel-collapse-enter-active, .panel-collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.panel-collapse-enter-from, .panel-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
