<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  component: any
}>()

const emit = defineEmits<{
  update: [prop: string, value: any]
}>()

function updateProp(prop: string, value: any) {
  emit('update', prop, value)
}

const editingColumns = computed(() => {
  return (props.component.columns as any[]) || []
})

function addColumn() {
  const currentTotal = editingColumns.value.reduce((sum, c) => sum + (c.width || c.currentWidth || 6), 0)
  const newWidth = currentTotal < 12 ? Math.min(6, 12 - currentTotal) : 6
  
  const cols = [...editingColumns.value]
  cols.push({ components: [], width: newWidth, offset: 0, push: 0, pull: 0, size: 'md' })
  updateProp('columns', cols)
}

function removeColumn(index: number) {
  const cols = [...editingColumns.value]
  cols.splice(index, 1)
  updateProp('columns', cols)
}

function updateColumnProp(index: number, prop: string, val: any) {
  if (!props.component.columns) return
  // Mutate in-place to avoid array wrapper losing input focus
  props.component.columns[index][prop] = val
  updateProp('columns', props.component.columns)
}
</script>

<template>
  <div>
    <div class="prop-section">
      <h4 class="prop-section__title">Columns Configuration</h4>
      <p class="text-xs text-slate-500 mb-3">Adjust the width of each column (1-12 span).</p>
      
      <div
        v-for="(col, idx) in editingColumns"
        :key="idx"
        class="select-option-row flex gap-2 mb-2 items-center bg-slate-50 p-2 rounded border border-slate-200"
      >
        <span class="text-xs font-semibold text-slate-500 w-16">Col {{ idx + 1 }}</span>
        <div class="flex-1 flex items-center gap-2">
          <label class="text-xs text-slate-500">Width</label>
          <InputText
            :model-value="col.width"
            type="number"
            min="1"
            max="12"
            placeholder="6"
            class="w-full text-center"
            size="small"
            @update:model-value="updateColumnProp(idx, 'width', $event ? Number($event) : undefined)"
          />
        </div>
        <button
          class="select-option-remove hover:bg-red-100 hover:text-red-600 p-1 rounded transition-colors"
          title="Remove Column"
          @click="removeColumn(idx)"
        >✕</button>
      </div>
      
      <button class="prop-btn mt-2 w-full justify-center" @click="addColumn">
        + Add Column
      </button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
