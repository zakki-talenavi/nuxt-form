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
  min-height: 50px;
  display: flex;
  flex-direction: column;
}

/* Base styles ported from FormBuilder */
.canvas-empty {
  border: 2px dashed var(--builder-border);
  border-radius: var(--border-radius, 0.5rem);
  padding: 2rem;
  text-align: center;
  color: var(--builder-text-muted);
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--builder-surface);
}
.canvas-empty__hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.canvas-components {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.canvas-component {
  border: 1px solid var(--builder-border);
  border-radius: var(--border-radius, 0.5rem);
  background: var(--builder-surface);
  transition: all 0.2s;
  position: relative;
}
.canvas-component:hover {
  border-color: var(--builder-primary);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
.canvas-component.drag-over {
  border-top: 4px solid var(--builder-primary);
  padding-top: 0.5rem;
}
.canvas-component.is-selected {
  border-color: var(--builder-primary);
  box-shadow: 0 0 0 2px var(--builder-primary-subtle);
}
.canvas-component.is-selected::before {
  content: '';
  position: absolute;
  left: -1px;
  top: -1px;
  bottom: -1px;
  width: 4px;
  background: var(--builder-primary);
  border-radius: var(--border-radius, 0.5rem) 0 0 var(--border-radius, 0.5rem);
}

.canvas-component.is-dragging {
  opacity: 0.5;
  border-style: dashed;
}

.canvas-component__header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--builder-surface-hover);
  border-bottom: 1px solid var(--builder-border);
  border-radius: var(--border-radius, 0.5rem) var(--border-radius, 0.5rem) 0 0;
  gap: 0.5rem;
  cursor: grab;
}
.canvas-component__header:active {
  cursor: grabbing;
}

.canvas-component__drag {
  color: var(--builder-text-muted);
  font-size: 1.25rem;
  cursor: grab;
  user-select: none;
}

.canvas-component__type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--builder-primary);
  background: var(--builder-primary-subtle);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.canvas-component__key {
  font-size: 0.875rem;
  font-family: var(--font-family-mono, monospace);
  color: var(--builder-text-muted);
  margin-left: auto;
}

.canvas-component__actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.component-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  border-radius: 4px;
  color: var(--builder-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.component-action:hover {
  background: var(--builder-border);
  color: var(--builder-text);
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
  padding: 1rem;
  margin-top: 1rem;
  border: 2px dashed var(--builder-border);
  border-radius: var(--border-radius, 0.5rem);
  text-align: center;
  color: var(--builder-text-muted);
  transition: all 0.2s;
}
.canvas-drop-end.drag-over {
  border-color: var(--builder-primary);
  background: var(--builder-primary-subtle);
  color: var(--builder-primary);
}

.canvas-component__unknown {
  color: var(--builder-danger);
  background: #fef2f2;
  padding: 1rem;
  border-radius: var(--border-radius, 0.5rem);
  border: 1px solid #fecaca;
  font-family: monospace;
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
