<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'

const props = defineProps<{
  component: any,
  builder: any
}>()

const emit = defineEmits<{
  close: []
}>()

// --- Lazy Load Tabs for Performance ---
// defineAsyncComponent chunk-splits the code so the user's browser only downloads
// these files when the specific Accordion panel expands.
const DisplayTab = defineAsyncComponent(() => import('./tabs/DisplayTab.vue'))
const DataTab = defineAsyncComponent(() => import('./tabs/DataTab.vue'))
const ValidationTab = defineAsyncComponent(() => import('./tabs/ValidationTab.vue'))
const ApiTab = defineAsyncComponent(() => import('./tabs/ApiTab.vue'))
const ConditionalTab = defineAsyncComponent(() => import('./tabs/ConditionalTab.vue'))
const LogicTab = defineAsyncComponent(() => import('./tabs/LogicTab.vue'))
const LayoutTab = defineAsyncComponent(() => import('./tabs/LayoutTab.vue'))

// --- Component Type Checks ---
const NON_DATA_COMPONENTS = ['columns', 'panel', 'fieldset', 'container', 'well', 'button', 'htmlelement', 'content']

const hasDataTab = computed(() => {
  if (!props.component) return false
  return !NON_DATA_COMPONENTS.includes(props.component.type)
})

const hasValidationTab = computed(() => {
  if (!props.component) return false
  return !NON_DATA_COMPONENTS.includes(props.component.type) && props.component.type !== 'hidden'
})

// --- Prop Update Handler ---
function handlePropUpdate(prop: string, value: any) {
  if (!props.builder.selectedComponentKey.value) return
  props.builder.updateComponent(props.builder.selectedComponentKey.value, { [prop]: value })
}
</script>

<template>
  <div class="properties-panel" v-if="component">
    <div class="properties-header">
      <h3 class="properties-title">
        {{ component.type.charAt(0).toUpperCase() + component.type.slice(1) }} Properties
      </h3>
      <button class="properties-close" @click="emit('close')">✕</button>
    </div>
    <div class="properties-body">
      <Accordion :multiple="true" :value="['display']">
        <!-- Display Tab (Always present) -->
        <AccordionPanel value="display" class="editor-panel">
          <AccordionHeader>Display</AccordionHeader>
          <AccordionContent>
            <DisplayTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- Data Tab -->
        <AccordionPanel v-if="hasDataTab" value="data" class="editor-panel">
          <AccordionHeader>Data</AccordionHeader>
          <AccordionContent>
            <DataTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- Validation Tab -->
        <AccordionPanel v-if="hasValidationTab" value="validation" class="editor-panel">
          <AccordionHeader>Validation</AccordionHeader>
          <AccordionContent>
            <ValidationTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- API Tab -->
        <AccordionPanel v-if="hasDataTab" value="api" class="editor-panel">
          <AccordionHeader>API</AccordionHeader>
          <AccordionContent>
            <ApiTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- Conditional Tab -->
        <AccordionPanel value="conditional" class="editor-panel">
          <AccordionHeader>Conditional</AccordionHeader>
          <AccordionContent>
            <ConditionalTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- Layout Tab (Columns specific) -->
        <AccordionPanel v-if="component.type === 'columns'" value="layout" class="editor-panel">
          <AccordionHeader>Layout</AccordionHeader>
          <AccordionContent>
            <LayoutTab :component="component" @update="handlePropUpdate" />
          </AccordionContent>
        </AccordionPanel>

        <!-- Logic Tab -->
        <AccordionPanel value="logic" class="editor-panel">
          <AccordionHeader>Logic</AccordionHeader>
          <AccordionContent>
            <LogicTab />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--builder-surface, #ffffff);
  border-bottom: 1px solid var(--builder-border, #e5e7eb);
  box-sizing: border-box;
  width: 100%;
}

.properties-body {
  padding: 1rem;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
  box-sizing: border-box;
  width: 100%;
}

.properties-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-label, #374151);
}

.properties-close {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: var(--color-placeholder, #9ca3af);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.properties-close:hover {
  background: var(--color-hover, #f1f5f9);
  color: var(--color-label, #374151);
}

/* ─── Accordion Overrides ─── */
:deep(.p-accordionpanel) {
  border: none !important;
  margin-bottom: 0.5rem;
  background: var(--builder-surface, #ffffff);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
}

:deep(.p-accordionheader) {
  padding: 0.75rem 1rem;
  background: transparent;
  border: none !important;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-label, #374151);
  transition: background 0.2s ease;
}

:deep(.p-accordionheader:hover) {
  color: var(--builder-primary, #6366f1);
  background: var(--color-hover, #f9fafb);
}

:deep(.p-accordionheader-toggle-icon) {
  display: none !important;
}

:deep(.p-accordioncontent-content) {
  padding: 0.5rem 0 0 0;
  background: transparent;
  border: none !important;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

/* ─── Constrain all inputs inside properties ─── */
:deep(.p-accordioncontent-content *) {
  box-sizing: border-box;
}

:deep(.p-accordioncontent-content .p-inputtext),
:deep(.p-accordioncontent-content .p-select),
:deep(.p-accordioncontent-content .p-multiselect),
:deep(.p-accordioncontent-content .p-textarea),
:deep(.p-accordioncontent-content .code-editor-wrapper),
:deep(.p-accordioncontent-content .code-editor-container) {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

:deep(.p-accordioncontent-content .cm-editor) {
  max-width: 100%;
}
</style>
