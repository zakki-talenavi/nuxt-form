<script setup lang="ts">
/**
 * ========================================
 * FormBuilder Component (MVP)
 * ========================================
 * Drag-and-drop form builder with:
 * - Component palette sidebar
 * - Drag & drop reordering
 * - Property editor panel
 * - Live preview mode
 * - JSON schema export
 */
import { ref, computed, watch, nextTick } from 'vue'
import type { FormSchema, FormComponentSchema, SelectValue } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import { useComponentRegistry } from '../../composables/useComponentRegistry'

const props = withDefaults(
  defineProps<{
    schema?: FormSchema
  }>(),
  {
    schema: undefined,
  },
)

const emit = defineEmits<{
  'update:schema': [schema: FormSchema]
  'change': [schema: FormSchema]
}>()

const registry = useComponentRegistry()
const builder = useFormBuilder(props.schema)

// ─── Local state ─────────────────────────────────────────────
const showJsonPanel = ref(false)
const dragOverIndex = ref<number | null>(null)
const dragSourceIndex = ref<number | null>(null)
const editingSelectValues = ref<SelectValue[]>([])

// ─── Computed ────────────────────────────────────────────────
const jsonOutput = computed(() =>
  JSON.stringify(builder.exportSchema(), null, 2),
)

// ─── Watchers ────────────────────────────────────────────────
watch(
  () => builder.schema.value,
  (newSchema) => {
    emit('update:schema', JSON.parse(JSON.stringify(newSchema)))
    emit('change', JSON.parse(JSON.stringify(newSchema)))
  },
  { deep: true },
)

watch(
  () => builder.selectedComponent.value,
  (comp) => {
    if (comp?.type === 'select' && comp.data?.values) {
      editingSelectValues.value = [...comp.data.values]
    } else {
      editingSelectValues.value = []
    }
  },
  { immediate: true },
)

// ─── Drag & Drop Handlers ───────────────────────────────────
function handleDragStartPalette(type: string, event: DragEvent) {
  event.dataTransfer?.setData('componentType', type)
  event.dataTransfer?.setData('source', 'palette')
  dragSourceIndex.value = null
}

function handleDragStartCanvas(index: number, event: DragEvent) {
  event.dataTransfer?.setData('componentIndex', String(index))
  event.dataTransfer?.setData('source', 'canvas')
  dragSourceIndex.value = index
}

function handleDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(index: number, event: DragEvent) {
  event.preventDefault()
  dragOverIndex.value = null

  const source = event.dataTransfer?.getData('source')

  if (source === 'palette') {
    const type = event.dataTransfer?.getData('componentType')
    if (type) {
      builder.addComponent(type, index)
    }
  } else if (source === 'canvas') {
    const fromStr = event.dataTransfer?.getData('componentIndex')
    if (fromStr != null) {
      const fromIndex = parseInt(fromStr, 10)
      builder.moveComponent(fromIndex, index)
    }
  }

  dragSourceIndex.value = null
}

function handleDropEnd(event: DragEvent) {
  event.preventDefault()
  dragOverIndex.value = null

  const source = event.dataTransfer?.getData('source')

  if (source === 'palette') {
    const type = event.dataTransfer?.getData('componentType')
    if (type && builder.schema.value.components.length === 0) {
      builder.addComponent(type)
    }
  }
}

// ─── Property Editor Handlers ────────────────────────────────
function updateSelectedProp(prop: string, value: unknown) {
  if (builder.selectedComponentIndex.value === null) return
  builder.updateComponent(builder.selectedComponentIndex.value, { [prop]: value })
}

function updateValidation(prop: string, value: unknown) {
  if (builder.selectedComponentIndex.value === null) return
  const comp = builder.selectedComponent.value
  if (!comp) return

  builder.updateComponent(builder.selectedComponentIndex.value, {
    validate: { ...comp.validate, [prop]: value },
  })
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
  if (builder.selectedComponentIndex.value === null) return
  builder.updateComponent(builder.selectedComponentIndex.value, {
    data: { values: [...editingSelectValues.value] },
  })
}

function copySchema() {
  navigator.clipboard.writeText(jsonOutput.value)
}
</script>

<template>
  <div class="form-builder" :class="{ 'preview-mode': builder.isPreviewMode.value }">
    <!-- ─── Toolbar ─────────────────────────────────────────── -->
    <div class="builder-toolbar">
      <div class="builder-toolbar__left">
        <h2 class="builder-toolbar__title">📐 Form Builder</h2>
      </div>
      <div class="builder-toolbar__actions">
        <button
          class="toolbar-btn"
          :disabled="!builder.canUndo.value"
          title="Undo"
          @click="builder.undo()"
        >
          ↩
        </button>
        <button
          class="toolbar-btn"
          :disabled="!builder.canRedo.value"
          title="Redo"
          @click="builder.redo()"
        >
          ↪
        </button>
        <div class="toolbar-divider" />
        <button
          class="toolbar-btn"
          :class="{ active: builder.isPreviewMode.value }"
          @click="builder.togglePreview()"
        >
          {{ builder.isPreviewMode.value ? '✏️ Edit' : '👁 Preview' }}
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: showJsonPanel }"
          @click="showJsonPanel = !showJsonPanel"
        >
          { } JSON
        </button>
        <button
          class="toolbar-btn toolbar-btn--danger"
          @click="builder.clearForm()"
        >
          🗑 Clear
        </button>
      </div>
    </div>

    <div class="builder-content">
      <!-- ─── Sidebar: Component Palette ──────────────────── -->
      <aside v-if="!builder.isPreviewMode.value" class="builder-sidebar">
        <h3 class="sidebar-title">Components</h3>
        <div
          v-for="(components, group) in builder.builderGroups.value"
          :key="group"
          class="sidebar-group"
        >
          <h4 class="sidebar-group__title">{{ String(group).charAt(0).toUpperCase() + String(group).slice(1) }}</h4>
          <div class="sidebar-components">
            <div
              v-for="comp in components"
              :key="comp.schema.type"
              class="sidebar-component"
              draggable="true"
              @dragstart="handleDragStartPalette(comp.schema.type as string, $event)"
            >
              <span class="sidebar-component__icon">{{ comp.icon }}</span>
              <span class="sidebar-component__label">{{ comp.title }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- ─── Canvas: Form Preview ────────────────────────── -->
      <main class="builder-canvas">
        <div
          v-if="builder.schema.value.components.length === 0"
          class="canvas-empty"
          @dragover.prevent="handleDragOver(0, $event)"
          @dragleave="handleDragLeave"
          @drop="handleDropEnd"
        >
          <div class="canvas-empty__icon">📋</div>
          <p class="canvas-empty__text">Drag components here to build your form</p>
          <p class="canvas-empty__hint">Or click a component in the sidebar</p>
        </div>

        <TransitionGroup
          v-else
          name="component-list"
          tag="div"
          class="canvas-components"
        >
          <div
            v-for="(comp, index) in builder.schema.value.components"
            :key="comp.key"
            class="canvas-component"
            :class="{
              'is-selected': builder.selectedComponentIndex.value === index,
              'drag-over': dragOverIndex === index,
              'is-dragging': dragSourceIndex === index,
            }"
            :draggable="!builder.isPreviewMode.value"
            @click="builder.selectComponent(index)"
            @dragstart="handleDragStartCanvas(index, $event)"
            @dragover="handleDragOver(index, $event)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(index, $event)"
          >
            <div v-if="!builder.isPreviewMode.value" class="canvas-component__header">
              <span class="canvas-component__drag">⠿</span>
              <span class="canvas-component__type">{{ comp.type }}</span>
              <span class="canvas-component__key">{{ comp.key }}</span>
              <div class="canvas-component__actions">
                <button
                  class="component-action"
                  title="Duplicate"
                  @click.stop="builder.duplicateComponent(index)"
                >
                  📋
                </button>
                <button
                  class="component-action component-action--delete"
                  title="Remove"
                  @click.stop="builder.removeComponent(index)"
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
              />
              <div v-else class="canvas-component__unknown">
                Unknown: {{ comp.type }}
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- Drop zone at the end -->
        <div
          v-if="builder.schema.value.components.length > 0 && !builder.isPreviewMode.value"
          class="canvas-drop-end"
          :class="{ 'drag-over': dragOverIndex === builder.schema.value.components.length }"
          @dragover="handleDragOver(builder.schema.value.components.length, $event)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(builder.schema.value.components.length, $event)"
        >
          <span>Drop here to add at end</span>
        </div>
      </main>

      <!-- ─── Property Editor Panel ───────────────────────── -->
      <aside
        v-if="builder.selectedComponent.value && !builder.isPreviewMode.value"
        class="builder-properties"
      >
        <div class="properties-header">
          <h3 class="properties-title">Properties</h3>
          <button
            class="properties-close"
            @click="builder.selectComponent(null)"
          >
            ✕
          </button>
        </div>

        <div class="properties-body">
          <Accordion value="display" :activeIndex="0">
            <!-- ─── DISPLAY TAB ─── -->
            <AccordionPanel value="display" class="editor-panel">
              <AccordionHeader>Display</AccordionHeader>
              <AccordionContent>
                <div class="prop-field mt-3">
                  <label class="prop-label">Label</label>
                  <input
                    :value="builder.selectedComponent.value.label"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('label', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="prop-field">
                  <label class="prop-label">Label Position</label>
                  <select
                    class="prop-input"
                    :value="builder.selectedComponent.value.labelPosition || 'top'"
                    @change="updateSelectedProp('labelPosition', ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left-left">Left (Left-aligned)</option>
                    <option value="left-right">Left (Right-aligned)</option>
                    <option value="right-left">Right (Left-aligned)</option>
                    <option value="right-right">Right (Right-aligned)</option>
                  </select>
                </div>
                <div class="prop-field">
                  <label class="prop-label">Placeholder</label>
                  <input
                    :value="builder.selectedComponent.value.placeholder"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('placeholder', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="prop-field">
                  <label class="prop-label">Description</label>
                  <input
                    :value="builder.selectedComponent.value.description"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('description', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="prop-field">
                  <label class="prop-label">Tooltip</label>
                  <input
                    :value="builder.selectedComponent.value.tooltip"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('tooltip', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="flex-row">
                  <div class="prop-field flex-1">
                    <label class="prop-label">Prefix</label>
                    <input
                      :value="builder.selectedComponent.value.prefix"
                      type="text"
                      class="prop-input"
                      @input="updateSelectedProp('prefix', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div class="prop-field flex-1">
                    <label class="prop-label">Suffix</label>
                    <input
                      :value="builder.selectedComponent.value.suffix"
                      type="text"
                      class="prop-input"
                      @input="updateSelectedProp('suffix', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
                <div class="prop-field">
                  <label class="prop-label">Custom CSS Class</label>
                  <input
                    :value="builder.selectedComponent.value.customClass"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('customClass', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="prop-section">
                  <label class="prop-checkbox">
                    <input
                      type="checkbox"
                      :checked="builder.selectedComponent.value.hidden ?? false"
                      @change="updateSelectedProp('hidden', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Hidden</span>
                  </label>
                  <label class="prop-checkbox">
                    <input
                      type="checkbox"
                      :checked="builder.selectedComponent.value.disabled ?? false"
                      @change="updateSelectedProp('disabled', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Disabled</span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── DATA TAB ─── -->
            <AccordionPanel value="data" class="editor-panel">
              <AccordionHeader>Data</AccordionHeader>
              <AccordionContent>
                <div class="prop-field mt-3">
                  <label class="prop-label">Default Value</label>
                  <input
                    :value="builder.selectedComponent.value.defaultValue as string | number || ''"
                    type="text"
                    class="prop-input"
                    @input="updateSelectedProp('defaultValue', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="prop-section pt-2">
                  <label class="prop-checkbox">
                    <input
                      type="checkbox"
                      :checked="builder.selectedComponent.value.multiple ?? false"
                      @change="updateSelectedProp('multiple', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Multiple Values</span>
                  </label>
                </div>
                <!-- Select Values Editor -->
                <template v-if="builder.selectedComponent.value.type === 'select'">
                  <div class="prop-section">
                    <h4 class="prop-section__title">Options (Data Source)</h4>
                    <div
                      v-for="(opt, idx) in editingSelectValues"
                      :key="idx"
                      class="select-option-row"
                    >
                      <input
                        :value="opt.label"
                        type="text"
                        class="prop-input"
                        placeholder="Label"
                        @input="updateSelectOption(idx, 'label', ($event.target as HTMLInputElement).value)"
                      />
                      <input
                        :value="opt.value"
                        type="text"
                        class="prop-input prop-input--code"
                        placeholder="Value"
                        @input="updateSelectOption(idx, 'value', ($event.target as HTMLInputElement).value)"
                      />
                      <button
                        class="select-option-remove"
                        @click="removeSelectOption(idx)"
                      >✕</button>
                    </div>
                    <button class="prop-btn" @click="addSelectOption">+ Add Option</button>
                  </div>
                </template>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── VALIDATION TAB ─── -->
            <AccordionPanel value="validation" class="editor-panel">
              <AccordionHeader>Validation</AccordionHeader>
              <AccordionContent>
                <div class="mt-3">
                  <label class="prop-checkbox">
                    <input
                      type="checkbox"
                      :checked="builder.selectedComponent.value.validate?.required ?? false"
                      @change="updateValidation('required', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Required</span>
                  </label>
                </div>

                <template v-if="['textfield', 'textarea', 'email', 'password'].includes(builder.selectedComponent.value.type)">
                  <div class="flex-row mt-3">
                    <div class="prop-field flex-1">
                      <label class="prop-label">Min Length</label>
                      <input
                        :value="builder.selectedComponent.value.validate?.minLength ?? ''"
                        type="number"
                        class="prop-input"
                        min="0"
                        @input="updateValidation('minLength', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
                      />
                    </div>
                    <div class="prop-field flex-1">
                      <label class="prop-label">Max Length</label>
                      <input
                        :value="builder.selectedComponent.value.validate?.maxLength ?? ''"
                        type="number"
                        class="prop-input"
                        min="0"
                        @input="updateValidation('maxLength', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
                      />
                    </div>
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Regular Expression Pattern</label>
                    <input
                      :value="builder.selectedComponent.value.validate?.pattern ?? ''"
                      type="text"
                      class="prop-input prop-input--code"
                      placeholder="e.g. ^[a-zA-Z0-9]+$"
                      @input="updateValidation('pattern', ($event.target as HTMLInputElement).value || undefined)"
                    />
                  </div>
                </template>
                
                <div class="prop-field mt-3">
                  <label class="prop-label">Custom Error Message</label>
                  <input
                    :value="builder.selectedComponent.value.validate?.customMessage ?? ''"
                    type="text"
                    class="prop-input"
                    placeholder="Custom validation error text"
                    @input="updateValidation('customMessage', ($event.target as HTMLInputElement).value || undefined)"
                  />
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── API TAB ─── -->
            <AccordionPanel value="api" class="editor-panel">
              <AccordionHeader>API</AccordionHeader>
              <AccordionContent>
                <div class="prop-field mt-3">
                  <label class="prop-label">Property Name (API Key)</label>
                  <input
                    :value="builder.selectedComponent.value.key"
                    type="text"
                    class="prop-input prop-input--code"
                    @input="updateSelectedProp('key', ($event.target as HTMLInputElement).value)"
                  />
                  <small class="text-xs text-slate-500 mt-1 block">
                    The name of this field in the API endpoint.
                  </small>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── CONDITIONAL TAB ─── -->
            <AccordionPanel value="conditional" class="editor-panel">
              <AccordionHeader>Conditional</AccordionHeader>
              <AccordionContent>
                <div class="prop-section mt-3">
                  <h4 class="prop-section__title">Simple Conditional</h4>
                  <div class="prop-field">
                    <label class="prop-label">This component should Display:</label>
                    <select
                      class="prop-input"
                      :value="builder.selectedComponent.value.conditional?.show !== false ? 'true' : 'false'"
                      @change="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, show: $event.target.value === 'true' })"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">When the form component:</label>
                    <input
                      :value="builder.selectedComponent.value.conditional?.when ?? ''"
                      type="text"
                      class="prop-input prop-input--code"
                      placeholder="API Key of another component"
                      @input="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, when: $event.target.value })"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Has the value:</label>
                    <input
                      :value="builder.selectedComponent.value.conditional?.eq ?? ''"
                      type="text"
                      class="prop-input"
                      placeholder="Value to match"
                      @input="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, eq: $event.target.value })"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── LOGIC TAB ─── -->
            <AccordionPanel value="logic" class="editor-panel">
              <AccordionHeader>Logic</AccordionHeader>
              <AccordionContent>
                <div class="prop-section mt-3">
                  <p class="text-xs text-slate-500 mb-2">
                    Advanced Logic configuration using JSONLogic is active for this form, but the builder UI for complex nested logic objects is not yet fully implemented in this MVP.
                  </p>
                  <p class="text-xs text-slate-500">
                    Use the JSON Panel to edit the `logic` property manually.
                  </p>
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>
      </aside>

      <!-- ─── JSON Panel ──────────────────────────────────── -->
      <aside v-if="showJsonPanel" class="builder-json">
        <div class="json-header">
          <h3 class="json-title">JSON Schema</h3>
          <button class="toolbar-btn" @click="copySchema">📋 Copy</button>
        </div>
        <pre class="json-content"><code>{{ jsonOutput }}</code></pre>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.form-builder {
  --builder-bg: #f8fafc;
  --builder-sidebar-bg: #ffffff;
  --builder-border: #e2e8f0;
  --builder-primary: #6366f1;
  --builder-text: #1e293b;
  --builder-text-muted: #64748b;
  --builder-danger: #ef4444;

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--builder-bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--builder-text);
}

/* ─── Toolbar ──────────────────────────────────────────────── */
.builder-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid var(--builder-border);
  gap: 1rem;
  flex-shrink: 0;
}

.builder-toolbar__title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.builder-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.toolbar-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--builder-border);
  border-radius: 0.375rem;
  background: #ffffff;
  color: var(--builder-text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: var(--builder-primary);
  color: #ffffff;
  border-color: var(--builder-primary);
}

.toolbar-btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: var(--builder-danger);
  color: var(--builder-danger);
}

.toolbar-divider {
  width: 1px;
  height: 1.25rem;
  background: var(--builder-border);
  margin: 0 0.25rem;
}

/* ─── Content Layout ───────────────────────────────────────── */
.builder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── Sidebar ──────────────────────────────────────────────── */
.builder-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--builder-sidebar-bg);
  border-right: 1px solid var(--builder-border);
  overflow-y: auto;
  padding: 1rem;
}

.sidebar-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--builder-text-muted);
  margin: 0 0 0.75rem 0;
}

.sidebar-group {
  margin-bottom: 1.25rem;
}

.sidebar-group__title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--builder-text-muted);
  margin: 0 0 0.5rem 0;
}

.sidebar-components {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-component {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background: #f8fafc;
  border: 1px solid var(--builder-border);
  border-radius: 0.375rem;
  cursor: grab;
  transition: all 0.15s ease;
  font-size: 0.8125rem;
}

.sidebar-component:hover {
  background: #eef2ff;
  border-color: var(--builder-primary);
  transform: translateX(2px);
}

.sidebar-component:active {
  cursor: grabbing;
}

.sidebar-component__icon {
  font-size: 1rem;
}

.sidebar-component__label {
  font-weight: 500;
}

/* ─── Canvas ───────────────────────────────────────────────── */
.builder-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 2px dashed var(--builder-border);
  border-radius: 0.75rem;
  text-align: center;
  padding: 2rem;
  transition: all 0.2s ease;
}

.canvas-empty:hover,
.canvas-empty.drag-over {
  border-color: var(--builder-primary);
  background: rgba(99, 102, 241, 0.03);
}

.canvas-empty__icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.canvas-empty__text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--builder-text);
  margin: 0 0 0.25rem 0;
}

.canvas-empty__hint {
  font-size: 0.8125rem;
  color: var(--builder-text-muted);
  margin: 0;
}

.canvas-components {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.canvas-component {
  background: #ffffff;
  border: 1.5px solid var(--builder-border);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  overflow: hidden;
}

.canvas-component:hover {
  border-color: #a5b4fc;
}

.canvas-component.is-selected {
  border-color: var(--builder-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.canvas-component.drag-over {
  border-color: var(--builder-primary);
  border-style: dashed;
  background: rgba(99, 102, 241, 0.03);
}

.canvas-component.is-dragging {
  opacity: 0.4;
}

.canvas-component__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--builder-border);
  font-size: 0.75rem;
}

.canvas-component__drag {
  cursor: grab;
  color: var(--builder-text-muted);
  font-size: 0.875rem;
  user-select: none;
}

.canvas-component__type {
  font-weight: 600;
  color: var(--builder-primary);
  text-transform: uppercase;
  font-size: 0.625rem;
  letter-spacing: 0.05em;
  background: #eef2ff;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.canvas-component__key {
  color: var(--builder-text-muted);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.6875rem;
}

.canvas-component__actions {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}

.component-action {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  opacity: 0.6;
  transition: all 0.15s ease;
}

.component-action:hover {
  opacity: 1;
  background: #e2e8f0;
}

.component-action--delete:hover {
  background: #fef2f2;
  color: var(--builder-danger);
}

.canvas-component__preview {
  padding: 0.75rem;
}

.canvas-component__unknown {
  padding: 0.5rem;
  background: #fef3c7;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: #92400e;
}

.canvas-drop-end {
  border: 2px dashed var(--builder-border);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  color: var(--builder-text-muted);
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  transition: all 0.2s ease;
}

.canvas-drop-end.drag-over {
  border-color: var(--builder-primary);
  background: rgba(99, 102, 241, 0.03);
  color: var(--builder-primary);
}

/* ─── Properties Panel ─────────────────────────────────────── */
.builder-properties {
  width: 380px;
  flex-shrink: 0;
  background: var(--builder-sidebar-bg);
  border-left: 1px solid var(--builder-border);
  display: flex;
  flex-direction: column;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--builder-border);
  flex-shrink: 0;
}

.properties-body {
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.p-accordion) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--builder-sidebar-bg);
}

:deep(.p-accordionpanel) {
  border: none !important;
  border-bottom: 1px solid var(--builder-border) !important;
}

:deep(.p-accordionheader) {
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--builder-text);
  background: var(--builder-sidebar-bg); /* Clean white background */
  border: none !important;
  transition: all 0.2s ease;
}

:deep(.p-accordionheader:hover) {
  background: #f8fafc; /* Subtle gray on hover */
  color: var(--builder-primary);
}

:deep(.p-accordionpanel:first-child) {
  border-top: none !important; /* Let the main header handle the top border */
}

:deep(.p-accordionheader-active) {
  border-bottom: 1px solid var(--builder-border) !important;
  background: #fafaf9; /* Very slight off-white for active */
  color: var(--builder-primary);
}

:deep(.p-accordioncontent-content) {
  padding: 1rem;
  background: var(--builder-sidebar-bg);
  border: none !important;
}

.properties-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
}

.properties-close {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: var(--builder-text-muted);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.properties-close:hover {
  background: #f1f5f9;
}

.properties-body {
  padding: 1rem;
}

.prop-field {
  margin-bottom: 0.875rem;
}

.prop-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--builder-text-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.prop-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
  border: 1px solid var(--builder-border);
  border-radius: 0.375rem;
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.prop-input:focus {
  border-color: var(--builder-primary);
}

.prop-input--code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
}

.prop-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--builder-border);
}

.prop-section__title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--builder-text-muted);
  margin: 0 0 0.75rem 0;
}

.prop-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.prop-checkbox input[type="checkbox"] {
  accent-color: var(--builder-primary);
}

.prop-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px dashed var(--builder-border);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--builder-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  margin-top: 0.375rem;
}

.prop-btn:hover {
  background: #eef2ff;
  border-color: var(--builder-primary);
}

.select-option-row {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
  align-items: center;
}

.select-option-row .prop-input {
  flex: 1;
  min-width: 0;
}

.select-option-remove {
  background: none;
  border: none;
  color: var(--builder-danger);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
  flex-shrink: 0;
  border-radius: 0.25rem;
}

.select-option-remove:hover {
  background: #fef2f2;
}

/* ─── JSON Panel ───────────────────────────────────────────── */
.builder-json {
  width: 360px;
  flex-shrink: 0;
  background: #1e293b;
  color: #e2e8f0;
  border-left: 1px solid var(--builder-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.json-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.json-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
}

.json-header .toolbar-btn {
  background: #334155;
  border-color: #475569;
  color: #e2e8f0;
  font-size: 0.75rem;
}

.json-header .toolbar-btn:hover {
  background: #475569;
}

.json-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre;
  color: #a5f3fc;
}

/* ─── Transitions ──────────────────────────────────────────── */
.component-list-move,
.component-list-enter-active,
.component-list-leave-active {
  transition: all 0.25s ease;
}

.component-list-enter-from,
.component-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.component-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
