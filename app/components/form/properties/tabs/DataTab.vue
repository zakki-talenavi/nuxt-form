<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue'
import type { SelectValue } from '../../../types/form'

const CodeEditor = defineAsyncComponent(() => import('../../CodeEditor.vue'))

const props = defineProps<{
  component: any
}>()

const emit = defineEmits<{
  update: [prop: string, value: any]
}>()

const editingSelectValues = ref<SelectValue[]>([])

watch(
  () => props.component,
  (comp) => {
    if (comp?.type === 'select' && comp.data?.values) {
      editingSelectValues.value = [...comp.data.values]
    } else {
      editingSelectValues.value = []
    }
  },
  { immediate: true }
)

function updateProp(prop: string, value: any) {
  emit('update', prop, value)
}

function addSelectOption() {
  editingSelectValues.value.push({ label: '', value: '' })
  syncSelectValues()
}

function removeSelectOption(index: number) {
  editingSelectValues.value.splice(index, 1)
  syncSelectValues()
}

function updateSelectOption(index: number, field: 'label' | 'value', val: string) {
  editingSelectValues.value[index] = {
    ...editingSelectValues.value[index],
    [field]: val,
  }
  syncSelectValues()
}

function syncSelectValues() {
  updateProp('data', { values: [...editingSelectValues.value] })
}
</script>

<template>
  <div>
    <div class="prop-field mt-3">
      <label class="prop-label">Default Value</label>
      <InputText
        :model-value="(component.defaultValue as string | number) || ''"
        class="w-full"
        size="small"
        @update:model-value="updateProp('defaultValue', $event)"
      />
    </div>
    
    <div class="prop-section pt-3 flex items-center gap-2">
      <Checkbox
        :model-value="component.multiple ?? false"
        binary
        inputId="propMultiple"
        @update:model-value="updateProp('multiple', $event)"
      />
      <label for="propMultiple" class="prop-label mb-0 cursor-pointer">Multiple Values</label>
    </div>
    
    <div class="prop-field mt-3">
      <CodeEditor
        :model-value="component.calculateValue"
        mode="javascript"
        label="Calculated Value"
        tooltip="Use JavaScript to calculate this component's value based on other fields. Access other fields via the 'data' object."
        placeholder="value = data.field1 + data.field2;"
        height="120px"
        @change="updateProp('calculateValue', $event)"
      />
    </div>

    <!-- Select Values Editor -->
    <template v-if="component.type === 'select'">
      <div class="prop-section">
        <h4 class="prop-section__title">Options (Data Source)</h4>
        <div
          v-for="(opt, idx) in editingSelectValues"
          :key="idx"
          class="select-option-row flex gap-2 mb-2"
        >
          <InputText
            :model-value="opt.label"
            class="w-full"
            size="small"
            placeholder="Label"
            @update:model-value="updateSelectOption(idx, 'label', $event)"
          />
          <InputText
            :model-value="opt.value"
            class="w-full font-mono text-xs"
            size="small"
            placeholder="value"
            @update:model-value="updateSelectOption(idx, 'value', $event)"
          />
          <button class="prop-btn !mt-0 !px-2" @click="removeSelectOption(idx)">
            ❌
          </button>
        </div>
        <button class="prop-btn w-full justify-center" @click="addSelectOption">
          + Add Option
        </button>
      </div>
    </template>
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

.prop-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px dashed var(--builder-border, #e5e7eb);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--builder-primary, #6366f1);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  margin-top: 0.375rem;
}

.prop-btn:hover {
  background: var(--builder-primary-subtle, #eef2ff);
  border-color: var(--builder-primary, #6366f1);
}

.select-option-row {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
  align-items: center;
}
</style>
