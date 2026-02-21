<script setup lang="ts">
/**
 * TreeFieldNode Component
 * Represents a single node (and its children) inside a TreeField.
 */
import { inject } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  components: FormComponentSchema[]
  node: Record<string, unknown>
  disabled: boolean
  readOnly: boolean
  depth: number
}>()

const emit = defineEmits<{
  'update:node': [value: Record<string, unknown>]
  'remove': []
}>()

const registry = inject('componentRegistry') as any

function onUpdateData(key: string, value: unknown) {
  const newData = { ...(props.node.data as Record<string, unknown>), [key]: value }
  emit('update:node', { ...props.node, data: newData })
}

function addChild() {
  const currentChildren = Array.isArray(props.node.children) ? props.node.children : []
  emit('update:node', {
    ...props.node,
    children: [...currentChildren, { data: {}, children: [] }]
  })
}

function updateChild(index: number, childNode: Record<string, unknown>) {
  const currentChildren = [...(props.node.children as any[])]
  currentChildren[index] = childNode
  emit('update:node', { ...props.node, children: currentChildren })
}

function removeChild(index: number) {
  const currentChildren = [...(props.node.children as any[])]
  currentChildren.splice(index, 1)
  emit('update:node', { ...props.node, children: currentChildren })
}
</script>

<template>
  <div class="tree-node" :class="'tree-node--depth-' + depth">
    <div class="tree-node__content">
      <div class="tree-node__fields">
        <!-- Render the fields for this node's data -->
        <template v-for="comp in components" :key="comp.key">
          <component
            v-if="registry?.getComponent(comp.type)"
            :is="registry.getComponent(comp.type)"
            :component="comp"
            :model-value="(node.data || {})[comp.key]"
            :disabled="disabled || comp.disabled"
            :read-only="readOnly"
            :errors="[]"
            @update:model-value="(val: unknown) => onUpdateData(comp.key, val)"
            @blur="$emit('blur', comp.key)"
          />
        </template>
      </div>
      
      <div class="tree-node__actions flex flex-col gap-2">
        <Button 
          v-if="!disabled && !readOnly" 
          severity="secondary" 
          outlined 
          size="small" 
          @click="addChild"
        >
          <span class="mr-1">+</span> Add Child
        </Button>
        <Button 
          v-if="!disabled && !readOnly && depth > 0" 
          severity="danger" 
          text 
          size="small" 
          @click="$emit('remove')"
        >
          <span class="mr-1">✕</span> Remove
        </Button>
      </div>
    </div>

    <!-- Recursive Children -->
    <div v-if="node.children && (node.children as any[]).length > 0" class="tree-node__children">
      <TreeFieldNode
        v-for="(child, idx) in (node.children as any[])"
        :key="idx"
        :components="components"
        :node="child"
        :disabled="disabled"
        :read-only="readOnly"
        :depth="depth + 1"
        @update:node="(val) => updateChild(idx, val)"
        @remove="removeChild(idx)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node {
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--color-input-bg, #ffffff);
  margin-bottom: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s;
}

.tree-node:hover {
  border-color: var(--color-primary, #6366f1);
}

.tree-node__content {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.02);
  align-items: flex-start;
}

.tree-node__fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tree-node__actions {
  flex: 0 0 100px;
}

.tree-node__children {
  padding: 1rem 1rem 0 2rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
  background: rgba(0, 0, 0, 0.01);
}
</style>
