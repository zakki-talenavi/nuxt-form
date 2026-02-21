<script setup lang="ts">
/**
 * TreeField Component
 * Renders a nested hierarchy of nodes based on its `components` array.
 */
import { computed } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'
import TreeFieldNode from './TreeFieldNode.vue'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>[]]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)
const components = computed<FormComponentSchema[]>(() => props.component.components ?? [])

// For a tree, the modelValue is usually an array of root nodes.
// Each node has { data: {...}, children: [...] }
const rootNodes = computed({
  get() {
    const val = props.modelValue
    if (Array.isArray(val)) return val as Record<string, unknown>[]
    if (val && typeof val === 'object') return [val as Record<string, unknown>]
    return []
  },
  set(newVal: Record<string, unknown>[]) {
    if (props.component.multiple === false && newVal.length === 1) {
      emit('update:modelValue', newVal[0] as any)
    } else {
      emit('update:modelValue', newVal)
    }
  }
})

function addRootNode() {
  const newRoots = [...rootNodes.value, { data: {}, children: [] }]
  rootNodes.value = newRoots
}

function updateRootNode(index: number, node: Record<string, unknown>) {
  const newRoots = [...rootNodes.value]
  newRoots[index] = node
  rootNodes.value = newRoots
}

function removeRootNode(index: number) {
  const newRoots = [...rootNodes.value]
  newRoots.splice(index, 1)
  rootNodes.value = newRoots
}
</script>

<template>
  <div class="form-field tree-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="tree-field__nodes">
      <TreeFieldNode
        v-for="(node, idx) in rootNodes"
        :key="idx"
        :components="components"
        :node="node"
        :disabled="disabled"
        :read-only="readOnly"
        :depth="0"
        @update:node="(val) => updateRootNode(idx, val)"
        @remove="removeRootNode(idx)"
      />
      
      <div v-if="rootNodes.length === 0" class="tree-field__empty">
        No {{ component.label || 'items' }} added.
      </div>

      <Button
        v-if="!disabled && !readOnly"
        type="button"
        severity="secondary"
        outlined
        class="mt-3 w-full justify-center"
        @click="addRootNode"
      >
        <span class="mr-2 font-bold">+</span>
        Add {{ component.label || 'Node' }}
      </Button>
    </div>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.tree-field { margin-bottom: 1.25rem; }
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.5rem; letter-spacing: -0.01em; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

.tree-field__nodes {
  background: var(--color-table-header, #f9fafb);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem;
}

.tree-field__empty {
  text-align: center;
  color: var(--color-placeholder, #9ca3af);
  font-size: 0.875rem;
  padding: 1rem 0;
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
