<script setup lang="ts">
import CodeEditor from './CodeEditor.vue'
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
import { ref, computed, watch, provide, nextTick } from 'vue'
import type { FormSchema, FormComponentSchema, SelectValue } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import { useComponentRegistry } from '../../composables/useComponentRegistry'
import BuilderDropZone from './BuilderDropZone.vue'

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
provide('formBuilder', builder)

// ─── Local state ─────────────────────────────────────────────
const showJsonPanel = ref(false)
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
  event.dataTransfer?.setData('text/plain', JSON.stringify({
    sourceFormat: 'builder-palette',
    componentType: type
  }))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// ─── Property Editor Handlers ────────────────────────────────
function updateSelectedProp(prop: string, value: unknown) {
  if (!builder.selectedComponentKey.value) return
  builder.updateComponent(builder.selectedComponentKey.value, { [prop]: value })
}

function updateValidation(prop: string, value: unknown) {
  if (!builder.selectedComponentKey.value) return
  const comp = builder.selectedComponent.value
  if (!comp) return

  builder.updateComponent(builder.selectedComponentKey.value, {
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
  if (!builder.selectedComponentKey.value) return
  builder.updateComponent(builder.selectedComponentKey.value, {
    data: { values: [...editingSelectValues.value] },
  })
}

// ─── Columns Editor (Layout Tab) ─────────────────────────────
const editingColumns = computed(() => {
  if (builder.selectedComponent.value?.type === 'columns') {
    return (builder.selectedComponent.value.columns as any[]) || []
  }
  return []
})

function addColumn() {
  const comp = builder.selectedComponent.value
  if (!comp) return
  const currentTotal = editingColumns.value.reduce((sum, c) => sum + (c.width || c.currentWidth || 6), 0)
  const newWidth = currentTotal < 12 ? Math.min(6, 12 - currentTotal) : 6
  
  const cols = [...(comp.columns || [])]
  cols.push({ components: [], width: newWidth, offset: 0, push: 0, pull: 0, size: 'md' })
  builder.updateComponent(comp.key, { columns: cols })
}

function removeColumn(index: number) {
  const comp = builder.selectedComponent.value
  if (!comp) return
  const cols = [...(comp.columns || [])]
  cols.splice(index, 1)
  builder.updateComponent(comp.key, { columns: cols })
}

function updateColumnProp(index: number, prop: string, val: any) {
  const comp = builder.selectedComponent.value
  if (!comp) return
  if (!comp.columns) comp.columns = []
  
  // Mutate in-place so input focus isn't lost by array/object replacement
  comp.columns[index][prop] = val
  builder.updateComponent(comp.key, { columns: comp.columns })
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
        <Accordion :multiple="true" :value="Object.keys(builder.builderGroups.value)">
          <AccordionPanel
            v-for="(components, group) in builder.builderGroups.value"
            :key="group"
            :value="String(group)"
            class="sidebar-group-panel"
          >
            <AccordionHeader class="sidebar-group-header">
              {{ String(group).charAt(0).toUpperCase() + String(group).slice(1) }}
            </AccordionHeader>
            <AccordionContent>
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
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </aside>

      <!-- ─── Canvas: Form Preview ────────────────────────── -->
      <main class="builder-canvas">
        <BuilderDropZone :list="builder.schema.value.components" />
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
                  <InputText
                    :model-value="builder.selectedComponent.value.label"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('label', $event)"
                  />
                </div>

                <!-- Button Specific Properties -->
                <template v-if="builder.selectedComponent.value.type === 'button'">
                  <div class="prop-field">
                    <label class="prop-label">Action</label>
                    <Select
                      :model-value="builder.selectedComponent.value.action || 'submit'"
                      :options="[
                        { label: 'Submit', value: 'submit' },
                        { label: 'Event', value: 'event' },
                        { label: 'Custom', value: 'custom' },
                        { label: 'Reset', value: 'reset' },
                        { label: 'OAuth', value: 'oauth' },
                        { label: 'POST to URL', value: 'url' }
                      ]"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('action', $event)"
                    />
                  </div>
                  <div class="prop-field flex items-center gap-2 mt-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.saveOnEnter ?? false"
                      binary
                      inputId="saveOnEnter"
                      @update:model-value="updateSelectedProp('saveOnEnter', $event)"
                    />
                    <label for="saveOnEnter" class="prop-label mb-0 cursor-pointer">Save On Enter</label>
                  </div>
                  <div class="prop-field mt-3">
                    <label class="prop-label">Theme</label>
                    <Select
                      :model-value="builder.selectedComponent.value.theme || 'primary'"
                      :options="[
                        { label: 'Primary', value: 'primary' },
                        { label: 'Secondary', value: 'secondary' },
                        { label: 'Info', value: 'info' },
                        { label: 'Success', value: 'success' },
                        { label: 'Warning', value: 'warning' },
                        { label: 'Danger', value: 'danger' }
                      ]"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('theme', $event)"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Size</label>
                    <Select
                      :model-value="builder.selectedComponent.value.size || 'md'"
                      :options="[
                        { label: 'Small', value: 'sm' },
                        { label: 'Medium', value: 'md' },
                        { label: 'Large', value: 'lg' }
                      ]"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('size', $event)"
                    />
                  </div>
                  <div class="prop-field flex items-center gap-2 mt-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.block ?? false"
                      binary
                      inputId="blockBtn"
                      @update:model-value="updateSelectedProp('block', $event)"
                    />
                    <label for="blockBtn" class="prop-label mb-0 cursor-pointer">Block Button</label>
                  </div>
                  <div class="prop-field mt-3">
                    <label class="prop-label">Left Icon</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.leftIcon"
                      placeholder="e.g. pi pi-check"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('leftIcon', $event)"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Right Icon</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.rightIcon"
                      placeholder="e.g. pi pi-arrow-right"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('rightIcon', $event)"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Shortcut</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.shortcut"
                      class="w-full"
                      size="small"
                      placeholder="e.g. Enter"
                      @update:model-value="updateSelectedProp('shortcut', $event)"
                    />
                  </div>
                  <div class="prop-field flex items-center gap-2 mt-3">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.disableOnInvalid ?? false"
                      binary
                      inputId="disableOnInvalid"
                      @update:model-value="updateSelectedProp('disableOnInvalid', $event)"
                    />
                    <label for="disableOnInvalid" class="prop-label mb-0 cursor-pointer">Disable on Form Invalid</label>
                  </div>
                </template>
                <!-- End Button Specific -->

                <div class="prop-field" v-if="builder.selectedComponent.value.type !== 'button'">
                  <label class="prop-label">Label Position</label>
                  <Select
                    :model-value="builder.selectedComponent.value.labelPosition || 'top'"
                    :options="[
                      { label: 'Top', value: 'top' },
                      { label: 'Bottom', value: 'bottom' },
                      { label: 'Left (Left-aligned)', value: 'left-left' },
                      { label: 'Left (Right-aligned)', value: 'left-right' },
                      { label: 'Right (Left-aligned)', value: 'right-left' },
                      { label: 'Right (Right-aligned)', value: 'right-right' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('labelPosition', $event)"
                  />
                </div>
                <div class="prop-field" v-if="!['button', 'checkbox'].includes(builder.selectedComponent.value.type)">
                  <label class="prop-label">Placeholder</label>
                  <InputText
                    :model-value="builder.selectedComponent.value.placeholder"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('placeholder', $event)"
                  />
                </div>
                <div class="prop-field">
                  <label class="prop-label">Description</label>
                  <InputText
                    :model-value="builder.selectedComponent.value.description"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('description', $event)"
                  />
                </div>
                <div class="prop-field">
                  <label class="prop-label">Tooltip</label>
                  <InputText
                    :model-value="builder.selectedComponent.value.tooltip"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('tooltip', $event)"
                  />
                </div>
                <div class="flex-row" v-if="!['button', 'checkbox'].includes(builder.selectedComponent.value.type)">
                  <div class="prop-field flex-1">
                    <label class="prop-label">Prefix</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.prefix"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('prefix', $event)"
                    />
                  </div>
                  <div class="prop-field flex-1">
                    <label class="prop-label">Suffix</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.suffix"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('suffix', $event)"
                    />
                  </div>
                </div>
                <div class="prop-field mt-3">
                  <CodeEditor
                    :model-value="builder.selectedComponent.value.customClass"
                    mode="css"
                    label="Custom CSS Class"
                    tooltip="Custom CSS classes to apply to this component"
                    placeholder="btn btn-primary custom-field ..."
                    height="60px"
                    @change="updateSelectedProp('customClass', $event)"
                  />
                </div>
                <div class="prop-field mt-3">
                  <label class="prop-label">Tab Index</label>
                  <InputText
                    :model-value="builder.selectedComponent.value.tabindex"
                    class="w-full"
                    size="small"
                    placeholder="0"
                    @update:model-value="updateSelectedProp('tabindex', $event)"
                  />
                </div>
                
                <div class="prop-section mt-4 flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.hidden ?? false"
                      binary
                      inputId="propHidden"
                      @update:model-value="updateSelectedProp('hidden', $event)"
                    />
                    <label for="propHidden" class="prop-label mb-0 cursor-pointer">Hidden</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.disabled ?? false"
                      binary
                      inputId="propDisabled"
                      @update:model-value="updateSelectedProp('disabled', $event)"
                    />
                    <label for="propDisabled" class="prop-label mb-0 cursor-pointer">Disabled</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.autofocus ?? false"
                      binary
                      inputId="propAutofocus"
                      @update:model-value="updateSelectedProp('autofocus', $event)"
                    />
                    <label for="propAutofocus" class="prop-label mb-0 cursor-pointer">Initial Focus</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.tableView ?? true"
                      binary
                      inputId="propTableView"
                      @update:model-value="updateSelectedProp('tableView', $event)"
                    />
                    <label for="propTableView" class="prop-label mb-0 cursor-pointer">Table View</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="builder.selectedComponent.value.modalEdit ?? false"
                      binary
                      inputId="propModalEdit"
                      @update:model-value="updateSelectedProp('modalEdit', $event)"
                    />
                    <label for="propModalEdit" class="prop-label mb-0 cursor-pointer">Modal Edit</label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── DATA TAB ─── -->
            <AccordionPanel value="data" class="editor-panel">
              <AccordionHeader>Data</AccordionHeader>
              <AccordionContent>
                <div class="prop-field mt-3">
                  <label class="prop-label">Default Value</label>
                  <InputText
                    :model-value="(builder.selectedComponent.value.defaultValue as string | number) || ''"
                    class="w-full"
                    size="small"
                    @update:model-value="updateSelectedProp('defaultValue', $event)"
                  />
                </div>
                <div class="prop-section pt-3 flex items-center gap-2">
                  <Checkbox
                    :model-value="builder.selectedComponent.value.multiple ?? false"
                    binary
                    inputId="propMultiple"
                    @update:model-value="updateSelectedProp('multiple', $event)"
                  />
                  <label for="propMultiple" class="prop-label mb-0 cursor-pointer">Multiple Values</label>
                </div>
                <div class="prop-field mt-3">
                  <CodeEditor
                    :model-value="builder.selectedComponent.value.calculateValue"
                    mode="javascript"
                    label="Calculated Value"
                    tooltip="Use JavaScript to calculate this component's value based on other fields. You can access other fields via the 'data' object."
                    placeholder="value = data.field1 + data.field2;"
                    height="120px"
                    @change="updateSelectedProp('calculateValue', $event)"
                  />
                </div>
                <!-- Select Values Editor -->
                <template v-if="builder.selectedComponent.value.type === 'select'">
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
                        placeholder="Value"
                        @update:model-value="updateSelectOption(idx, 'value', $event)"
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
                <div class="mt-3 flex items-center gap-2">
                  <Checkbox
                    :model-value="builder.selectedComponent.value.validate?.required ?? false"
                    binary
                    inputId="valRequired"
                    @update:model-value="updateValidation('required', $event)"
                  />
                  <label for="valRequired" class="prop-label mb-0 cursor-pointer">Required</label>
                </div>

                <template v-if="['textfield', 'textarea', 'email', 'password'].includes(builder.selectedComponent.value.type)">
                  <div class="flex-row mt-3 gap-3">
                    <div class="prop-field flex-1">
                      <label class="prop-label">Min Length</label>
                      <InputText
                        :model-value="builder.selectedComponent.value.validate?.minLength"
                        type="number"
                        class="w-full"
                        size="small"
                        min="0"
                        @update:model-value="(val) => updateValidation('minLength', val ? Number(val) : undefined)"
                      />
                    </div>
                    <div class="prop-field flex-1">
                      <label class="prop-label">Max Length</label>
                      <InputText
                        :model-value="builder.selectedComponent.value.validate?.maxLength"
                        type="number"
                        class="w-full"
                        size="small"
                        min="0"
                        @update:model-value="(val) => updateValidation('maxLength', val ? Number(val) : undefined)"
                      />
                    </div>
                  </div>
                  <div class="prop-field mt-3">
                    <label class="prop-label">Regular Expression Pattern</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.validate?.pattern"
                      class="w-full font-mono text-xs"
                      size="small"
                      placeholder="e.g. ^[a-zA-Z0-9]+$"
                      @update:model-value="(val) => updateValidation('pattern', val || undefined)"
                    />
                  </div>
                </template>
                
                <div class="prop-field mt-3">
                  <CodeEditor
                    :model-value="builder.selectedComponent.value.validate?.custom"
                    mode="javascript"
                    label="Custom Validation Logic"
                    tooltip="Write custom validation logic. Return 'true' if valid, or a string error message. Accessible variables: input, data."
                    placeholder="valid = (input === 'secret') ? true : 'Invalid password';"
                    height="120px"
                    @change="updateValidation('custom', $event)"
                  />
                </div>
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
                  <InputText
                    :model-value="builder.selectedComponent.value.key"
                    class="w-full font-mono text-xs"
                    size="small"
                    @update:model-value="updateSelectedProp('key', $event)"
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
                    <Select
                      :model-value="builder.selectedComponent.value.conditional?.show !== false ? 'true' : 'false'"
                      :options="[
                        { label: 'True', value: 'true' },
                        { label: 'False', value: 'false' }
                      ]"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      size="small"
                      @update:model-value="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, show: $event === 'true' })"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">When the form component:</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.conditional?.when"
                      class="w-full font-mono text-xs"
                      size="small"
                      placeholder="API Key of another component"
                      @update:model-value="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, when: $event })"
                    />
                  </div>
                  <div class="prop-field">
                    <label class="prop-label">Has the value:</label>
                    <InputText
                      :model-value="builder.selectedComponent.value.conditional?.eq"
                      class="w-full"
                      size="small"
                      placeholder="Value to match"
                      @update:model-value="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, eq: $event })"
                    />
                  </div>
                  <div class="prop-field mt-4 border-t border-slate-200 pt-4">
                    <h4 class="prop-section__title">Advanced Logic</h4>
                    <CodeEditor
                      :model-value="builder.selectedComponent.value.conditional?.javascript"
                      mode="javascript"
                      label="Custom Conditional Logic"
                      tooltip="Write custom javascript logic to determine if this component should be displayed. Set 'show' to true or false. Accessible variables: data, row."
                      placeholder="show = (data.firstName === 'John');"
                      height="120px"
                      @change="updateSelectedProp('conditional', { ...builder.selectedComponent.value.conditional, javascript: $event })"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- ─── LAYOUT TAB (Columns) ─── -->
            <AccordionPanel v-if="builder.selectedComponent.value.type === 'columns'" value="layout" class="editor-panel">
              <AccordionHeader>Layout</AccordionHeader>
              <AccordionContent>
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
                      class="select-option-remove hover:bg-red-100 hover:text-red-600 p-1 rounded"
                      title="Remove Column"
                      @click="removeColumn(idx)"
                    >✕</button>
                  </div>
                  
                  <button class="prop-btn mt-2 w-full" @click="addColumn">+ Add Column</button>
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
  --builder-bg: #f1f5f9;
  --builder-sidebar-bg: #ffffff;
  --builder-border: #cbd5e1;
  --builder-primary: #6366f1;
  --builder-primary-subtle: #e0e7ff;
  --builder-text: #0f172a;
  --builder-text-muted: #64748b;
  --builder-danger: #ef4444;
  --builder-surface: #ffffff;
  --builder-surface-hover: #f8fafc;

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
  background: var(--builder-sidebar-bg);
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
  background: var(--builder-surface);
  color: var(--builder-text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--builder-surface-hover);
  border-color: #94a3b8;
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
  background: var(--builder-surface);
  border: 1px solid var(--builder-border);
  border-radius: 0.375rem;
  cursor: grab;
  transition: all 0.15s ease;
  font-size: 0.8125rem;
}

.sidebar-component:hover {
  background: var(--builder-primary-subtle);
  border-color: var(--builder-primary);
  color: var(--builder-primary);
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
  background: var(--builder-surface);
  border: 1px solid var(--builder-border);
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
  background: var(--builder-surface-hover);
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

/* ─── Properties Accordion Overrides ─── */
.builder-properties :deep(.p-accordion) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--builder-sidebar-bg);
}

.builder-properties :deep(.p-accordionpanel) {
  border: none !important;
  border-bottom: 1px solid var(--builder-border) !important;
}

.builder-properties :deep(.p-accordionheader) {
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--builder-text);
  background: var(--builder-sidebar-bg);
  border: none !important;
  transition: all 0.2s ease;
}

.builder-properties :deep(.p-accordionheader:hover) {
  background: #f8fafc;
  color: var(--builder-primary);
}

.builder-properties :deep(.p-accordionpanel:first-child) {
  border-top: none !important;
}

.builder-properties :deep(.p-accordionheader-active) {
  border-bottom: 1px solid var(--builder-border) !important;
  background: #fafaf9;
  color: var(--builder-primary);
}

.builder-properties :deep(.p-accordioncontent-content) {
  padding: 1rem;
  background: var(--builder-sidebar-bg);
  border: none !important;
}

/* ─── Sidebar Accordion Overrides ─── */
.builder-sidebar :deep(.p-accordionpanel) {
  border: none !important;
  margin-bottom: 0.75rem;
}

.builder-sidebar :deep(.p-accordionheader) {
  padding: 0;
  background: transparent;
  border: none !important;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--builder-text-muted);
}

.builder-sidebar :deep(.p-accordionheader:hover) {
  color: var(--builder-primary);
  background: transparent;
}

.builder-sidebar :deep(.p-accordionheader-toggle-icon) {
  display: none !important; /* Hide the arrow icon */
}

.builder-sidebar :deep(.p-accordioncontent-content) {
  padding: 0.5rem 0 0 0;
  background: transparent;
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
