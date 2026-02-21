<script setup lang="ts">
/**
 * TabsField Component
 * Tabbed interface — each tab has its own components[].
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface TabDef {
  label: string
  key: string
  components: FormComponentSchema[]
}

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

const tabs = computed<TabDef[]>(() => {
  return (props.component.components as TabDef[]) || []
})

const activeTab = ref(0)

function setActiveTab(index: number) {
  activeTab.value = index
}
</script>

<template>
  <div class="tabs-field" :class="[component.customClass]">
    <div class="tabs-field__header">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key || idx"
        type="button"
        class="tabs-field__tab"
        :class="{ 'tabs-field__tab--active': activeTab === idx }"
        @click="setActiveTab(idx)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-field__body">
      <template v-for="(tab, idx) in tabs" :key="tab.key || idx">
        <div v-show="activeTab === idx" class="tabs-field__panel">
          <template v-for="(child, childIdx) in tab.components" :key="child.key || childIdx">
            <slot name="renderComponent" :component="child" />
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tabs-field { margin-bottom: 1.25rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.5rem; overflow: hidden; }

.tabs-field__header {
  display: flex; overflow-x: auto; background: var(--color-hover, #f9fafb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.tabs-field__tab {
  padding: 0.625rem 1.25rem; font-size: 0.8125rem; font-weight: 500;
  border: none; background: none; cursor: pointer;
  color: var(--color-description, #6b7280);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease; white-space: nowrap;
}

.tabs-field__tab:hover { color: var(--color-text, #111827); background: rgba(0,0,0,0.02); }

.tabs-field__tab--active {
  color: var(--color-primary, #6366f1);
  border-bottom-color: var(--color-primary, #6366f1);
  background: var(--color-input-bg, #ffffff);
}

.tabs-field__body { padding: 1.25rem; background: var(--color-input-bg, #ffffff); }
.tabs-field__panel { display: flex; flex-direction: column; }
</style>
