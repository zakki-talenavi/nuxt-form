<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const CodeEditor = defineAsyncComponent(() => import('../../CodeEditor.vue'))

const props = defineProps<{
  component: any
}>()

const emit = defineEmits<{
  update: [prop: string, value: any]
}>()

function updateProp(prop: string, value: any) {
  emit('update', prop, value)
}

function updateConditionalProp(prop: string, value: any) {
  const conditional = props.component.conditional || {}
  updateProp('conditional', { ...conditional, [prop]: value })
}
</script>

<template>
  <div>
    <div class="prop-section mt-3">
      <h4 class="prop-section__title">Simple Conditional</h4>
      <div class="prop-field">
        <label class="prop-label">This component should Display:</label>
        <Select
          :model-value="component.conditional?.show !== false ? 'true' : 'false'"
          :options="[
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          size="small"
          @update:model-value="updateConditionalProp('show', $event === 'true')"
        />
      </div>
      <div class="prop-field">
        <label class="prop-label">When the form component:</label>
        <InputText
          :model-value="component.conditional?.when"
          class="w-full font-mono text-xs"
          size="small"
          placeholder="API Key of another component"
          @update:model-value="updateConditionalProp('when', $event)"
        />
      </div>
      <div class="prop-field">
        <label class="prop-label">Has the value:</label>
        <InputText
          :model-value="component.conditional?.eq"
          class="w-full"
          size="small"
          placeholder="Value to match"
          @update:model-value="updateConditionalProp('eq', $event)"
        />
      </div>
      <div class="prop-field mt-4 border-t border-slate-200 pt-4">
        <h4 class="prop-section__title">Advanced Logic</h4>
        <CodeEditor
          :model-value="component.conditional?.javascript"
          mode="javascript"
          label="Custom Conditional Logic"
          tooltip="Write custom javascript logic to determine if this component should be displayed. Set 'show' to true or false. Accessible variables: data, row."
          placeholder="show = (data.firstName === 'John');"
          height="120px"
          @change="updateConditionalProp('javascript', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.prop-field {
  margin-bottom: 0.875rem;
}

.prop-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-label, #374151);
  margin-bottom: 0.375rem;
}

.prop-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--builder-border, #e5e7eb);
}

.prop-section__title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-placeholder, #9ca3af);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
