<script lang="ts">
export default {
  name: 'BuilderDropZone'
}
</script>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { FormComponentSchema } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import { useComponentRegistry } from '../../composables/useComponentRegistry'
import { eachComponent } from '../../utils/schema-parser'

const props = defineProps<{
  list: FormComponentSchema[]
}>()

const builder = inject('formBuilder') as ReturnType<typeof useFormBuilder>
if (!builder) {
  throw new Error('BuilderDropZone must be used within a FormBuilder component')
}
const registry = useComponentRegistry()

const dragOverIndex = ref<number | null>(null)
const dragSourceKey = ref<string | null>(null)

// ─── Drag & Drop Handlers ────────────────────────────────────
function handleDragStart(comp: FormComponentSchema, event: DragEvent) {
  if (builder.isPreviewMode.value) return
  if (!event.dataTransfer) return

  dragSourceKey.value = comp.key
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify({
    sourceFormat: 'builder-canvas',
    componentKey: comp.key
  }))
}

function handleDragOver(index: number, event: DragEvent) {
  if (builder.isPreviewMode.value) return
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave(event: DragEvent) {
  const target = event.target as HTMLElement
  if (target && target.classList.contains('drag-over')) {
    dragOverIndex.value = null
  }
}

function handleDrop(index: number, event: DragEvent) {
  if (builder.isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  dragOverIndex.value = null

  if (!event.dataTransfer) return

  try {
    const dataStr = event.dataTransfer.getData('text/plain')
    if (!dataStr) return

    const data = JSON.parse(dataStr)

    // Case 1: Dropping a new component from Palette
    if (data.sourceFormat === 'builder-palette') {
      builder.addComponent(data.componentType, props.list, index)
    }
    // Case 2: Moving existing component within canvas
    else if (data.sourceFormat === 'builder-canvas') {
      // Find the component being dragged anywhere in the schema
      let sourceList: FormComponentSchema[] | null = null
      let sourceIndex = -1
      let sourceComp: FormComponentSchema | null = null

      // We find the parent list it currently belongs to
      const findInList = (list: FormComponentSchema[]) => {
         const idx = list.findIndex(c => c.key === data.componentKey)
         if (idx !== -1) {
           sourceList = list
           sourceIndex = idx
           sourceComp = list[idx]
           return true
         }
         let found = false
         eachComponent(list, (c) => {
           if (found) return
           if (c.components && findInList(c.components)) found = true
           if (c.columns) {
              for (const col of c.columns) {
                if (col.components && findInList(col.components)) found = true
              }
           }
         })
         return found
      }
      findInList(builder.schema.value.components)

      if (sourceList && sourceIndex !== -1 && sourceComp) {
         // Same list
         if (sourceList === props.list) {
            builder.moveComponent(props.list, sourceIndex, index)
         } else {
            // Between lists
            builder.moveComponentBetweenLists(sourceList, sourceIndex, props.list, index)
         }
      }
    }
  } catch (err) {
    console.error('Drop error:', err)
  }

  dragSourceKey.value = null
}

function handleDropEnd(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  handleDrop(props.list.length, event)
}
</script>

<template>
  <div class="builder-dropzone">
    <div
      v-if="list.length === 0"
      class="canvas-empty"
      @dragover.prevent.stop="handleDragOver(0, $event)"
      @dragleave.prevent.stop="handleDragLeave"
      @drop.prevent.stop="handleDropEnd"
    >
      <div v-if="!builder.isPreviewMode.value" class="canvas-empty__hint">Drag components here</div>
    </div>

    <TransitionGroup
      v-else
      name="component-list"
      tag="div"
      class="canvas-components"
    >
      <div
        v-for="(comp, index) in list"
        :key="comp.key"
        class="canvas-component"
        :class="{
          'is-selected': builder.selectedComponentKey.value === comp.key,
          'drag-over': dragOverIndex === index,
          'is-dragging': dragSourceKey === comp.key,
        }"
        :draggable="!builder.isPreviewMode.value"
        @click.stop="builder.selectComponent(comp.key)"
        @dragstart="handleDragStart(comp, $event)"
        @dragover.prevent.stop="handleDragOver(index, $event)"
        @dragleave.prevent.stop="handleDragLeave"
        @drop.prevent.stop="handleDrop(index, $event)"
      >
        <div v-if="!builder.isPreviewMode.value" class="canvas-component__header">
          <span class="canvas-component__drag">⠿</span>
          <span class="canvas-component__type">{{ comp.type }}</span>
          <span class="canvas-component__key">{{ comp.key }}</span>
          <div class="canvas-component__actions">
            <button
              class="component-action"
              title="Duplicate"
              @click.stop="builder.duplicateComponent(comp.key, list)"
            >
              📋
            </button>
            <button
              class="component-action component-action--delete"
              title="Remove"
              @click.stop="builder.removeComponent(comp.key, list)"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="canvas-component__preview">
          <component
            v-if="registry.getComponent(comp.type)"
            :is="registry.getComponent(comp.type)"
            :component="comp"
            :model-value="undefined"
            :errors="[]"
            :disabled="!builder.isPreviewMode.value"
            :read-only="!builder.isPreviewMode.value"
          >
            <!-- RECURSIVE RENDER: Provide to Layout Components -->
            <template #renderZone="{ list: childList }">
              <BuilderDropZone
                v-if="childList"
                :list="childList" 
              />
            </template>
          </component>
          <div v-else class="canvas-component__unknown">
            Unknown: {{ comp.type }}
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Drop zone at the end -->
    <div
      v-if="list.length > 0 && !builder.isPreviewMode.value"
      class="canvas-drop-end"
      :class="{ 'drag-over': dragOverIndex === list.length }"
      @dragover.prevent.stop="handleDragOver(list.length, $event)"
      @dragleave.prevent.stop="handleDragLeave"
      @drop.prevent.stop="handleDropEnd"
    >
      <span>Drop here to add at end</span>
    </div>
  </div>
</template>

<style scoped>
.builder-dropzone {
  min-height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
}

/* Base styles ported from FormBuilder */
.canvas-empty {
  border: 1.5px dashed var(--builder-border, #d1d5db);
  border-radius: var(--border-radius, 0.5rem);
  padding: 1.5rem;
  text-align: center;
  color: var(--color-placeholder, #9ca3af);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--color-input-bg, #ffffff);
  transition: all 0.2s;
}
.canvas-empty:hover {
  border-color: var(--builder-primary, #6366f1);
  background: var(--builder-primary-subtle, #eef2ff);
  color: var(--builder-primary, #6366f1);
}
.canvas-empty__hint {
  font-size: 0.8125rem;
  opacity: 0.8;
}

.canvas-components {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.canvas-component {
  border: 1.5px solid var(--builder-border, #e5e7eb);
  border-radius: var(--border-radius, 0.5rem);
  background: var(--builder-surface, #ffffff);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.canvas-component:hover {
  border-color: var(--builder-primary, #6366f1);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
.canvas-component.drag-over {
  border-top-width: 4px;
  border-top-color: var(--builder-primary, #6366f1);
  padding-top: 0;
}
.canvas-component.is-selected {
  border-color: var(--builder-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.canvas-component.is-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--builder-primary, #6366f1);
  z-index: 1;
}

.canvas-component.is-dragging {
  opacity: 0.4;
  border: 2px dashed var(--builder-primary, #6366f1);
  background: var(--builder-primary-subtle, #eef2ff);
}

.canvas-component__header {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: var(--color-hover, #f9fafb);
  border-bottom: 1px solid var(--builder-border, #e5e7eb);
  gap: 0.75rem;
  cursor: grab;
  user-select: none;
}
.canvas-component__header:active {
  cursor: grabbing;
}

.canvas-component__drag {
  color: var(--color-placeholder, #9ca3af);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}
.canvas-component:hover .canvas-component__drag {
  color: var(--builder-primary, #6366f1);
}

.canvas-component__type {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--builder-primary, #6366f1);
  background: var(--builder-primary-subtle, #eef2ff);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.canvas-component__key {
  font-size: 0.75rem;
  font-family: var(--font-family-mono, monospace);
  color: var(--color-description, #6b7280);
  margin-left: auto;
}

.canvas-component__actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.canvas-component:hover .canvas-component__actions {
  opacity: 1;
}

.component-action {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 4px;
  color: var(--color-description, #6b7280);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.component-action:hover {
  background: var(--color-border, #e5e7eb);
  color: var(--color-label, #374151);
}
.component-action--delete:hover {
  background: #fef2f2;
  color: var(--builder-danger);
}

.canvas-component__preview {
  padding: 1.25rem;
  min-height: 4rem;
}

.canvas-drop-end {
  flex: 1;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin-top: 0.75rem;
  border: 1.5px dashed var(--builder-border, #e5e7eb);
  border-radius: var(--border-radius, 0.5rem);
  color: var(--color-placeholder, #9ca3af);
  font-size: 0.8125rem;
  background: var(--color-hover, #f9fafb);
  transition: all 0.2s;
}
.canvas-drop-end:hover {
  border-color: var(--builder-primary, #6366f1);
  background: var(--builder-primary-subtle, #eef2ff);
  color: var(--builder-primary, #6366f1);
}
.canvas-drop-end.drag-over {
  border-style: solid;
  border-color: var(--builder-primary, #6366f1);
  background: var(--builder-primary-subtle, #eef2ff);
  color: var(--builder-primary, #6366f1);
}

.canvas-component__unknown {
  color: var(--color-error, #ef4444);
  background: #fef2f2;
  padding: 1rem;
  border-radius: var(--border-radius, 0.5rem);
  border: 1px solid #fecaca;
  font-family: var(--font-family-mono, monospace);
  font-size: 0.8125rem;
}

/* Transitions */
.component-list-move,
.component-list-enter-active,
.component-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.component-list-enter-from,
.component-list-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.component-list-leave-active {
  position: absolute;
}
</style>
