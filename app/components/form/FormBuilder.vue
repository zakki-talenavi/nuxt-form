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
import { ref, computed, watch, provide, nextTick } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import type { FormSchema, FormComponentSchema, SelectValue } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import { useComponentRegistry } from '../../composables/useComponentRegistry'
import BuilderDropZone from './BuilderDropZone.vue'
import WizardBuilderCanvas from './WizardBuilderCanvas.vue'
import PropertyEditor from './properties/PropertyEditor.vue'
import WizardPreview from './WizardPreview.vue'

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
const confirm = useConfirm()
provide('formBuilder', builder)

// ─── Local state ─────────────────────────────────────────────
const showJsonPanel = ref(false)
const showModeAlert = ref(false)
let modeAlertTimer: ReturnType<typeof setTimeout> | null = null

function handleFormModeClick() {
  if (builder.displayMode.value === 'wizard') {
    // Check if wizard has any actual components
    const hasComponents = builder.wizardPages.value.some(
      (panel) => panel.components && panel.components.length > 0
    )

    if (hasComponents) {
      showModeAlert.value = true
      if (modeAlertTimer) clearTimeout(modeAlertTimer)
      modeAlertTimer = setTimeout(() => { showModeAlert.value = false }, 4000)
      return
    }
  }
  builder.setDisplayMode('form')
}

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

// ─── Copy Handlers ───────────────────────────────────────────
function copySchema() {
  navigator.clipboard.writeText(jsonOutput.value)
}

// ─── Clear Confirmation ──────────────────────────────────────
function handleClear() {
  confirm.require({
    message: 'Apakah Anda yakin ingin menghapus semua komponen? Tindakan ini tidak bisa dibatalkan.',
    header: 'Konfirmasi Clear',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Ya, Hapus Semua',
    rejectProps: {
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      severity: 'danger',
    },
    accept: () => {
      builder.clearForm()
    },
  })
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
        <!-- Display Mode Toggle -->
        <div class="mode-toggle">
          <button
            class="mode-toggle__btn"
            :class="{ 'mode-toggle__btn--active': builder.displayMode.value === 'form' }"
            @click="handleFormModeClick"
          >
            📋 Form
          </button>
          <button
            class="mode-toggle__btn"
            :class="{ 'mode-toggle__btn--active': builder.displayMode.value === 'wizard' }"
            @click="builder.setDisplayMode('wizard')"
          >
            🧙 Wizard
          </button>
        </div>
        <div class="toolbar-divider" />
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
          @click="handleClear()"
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

      <!-- ─── Mode Alert ─────────────────────────────────── -->
      <Transition name="alert-slide">
        <div v-if="showModeAlert" class="mode-alert">
          <span class="mode-alert__icon">⚠️</span>
          <span class="mode-alert__text">Tidak bisa langsung kembali ke mode Form dari Wizard. Klik <strong>🗑 Clear</strong> terlebih dahulu untuk mereset, lalu pilih mode yang diinginkan.</span>
          <button class="mode-alert__close" @click="showModeAlert = false">✕</button>
        </div>
      </Transition>

      <!-- ─── Canvas: Form Preview ────────────────────────── -->
      <main class="builder-canvas">
        <!-- Wizard mode: builder canvas -->
        <WizardBuilderCanvas v-if="builder.displayMode.value === 'wizard' && !builder.isPreviewMode.value" />
        <!-- Wizard mode: live preview with stepper -->
        <div v-else-if="builder.displayMode.value === 'wizard' && builder.isPreviewMode.value" class="wizard-preview-wrapper">
          <WizardPreview />
        </div>
        <!-- Standard flat form canvas -->
        <BuilderDropZone v-else :list="builder.schema.value.components" />
      </main>

      <!-- ─── Property Editor Panel ───────────────────────── -->
      <aside v-if="builder.selectedComponent.value && !builder.isPreviewMode.value" class="builder-properties properties-panel">
        <PropertyEditor
          :component="builder.selectedComponent.value"
          :builder="builder"
          @close="builder.selectComponent(null)"
        />
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

    <!-- ─── Confirm Dialog ──────────────────────────────── -->
    <ConfirmDialog />
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

/* ─── Mode Toggle ─────────────────────────────────────────── */
.mode-toggle {
  display: flex;
  border: 1px solid var(--builder-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.mode-toggle__btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  background: var(--builder-surface);
  color: var(--builder-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}

.mode-toggle__btn:not(:last-child) {
  border-right: 1px solid var(--builder-border);
}

.mode-toggle__btn:hover:not(.mode-toggle__btn--active) {
  background: var(--builder-surface-hover);
}

.mode-toggle__btn--active {
  background: var(--builder-primary);
  color: #ffffff;
}

/* ─── Mode Alert ───────────────────────────────────────────── */
.mode-alert {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-bottom: 2px solid #f59e0b;
  color: #92400e;
  font-size: 0.8125rem;
  font-weight: 500;
}

.mode-alert__icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.mode-alert__text {
  flex: 1;
}

.mode-alert__close {
  background: none;
  border: none;
  color: #92400e;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.mode-alert__close:hover {
  opacity: 1;
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.3s ease;
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* ─── Content Layout ───────────────────────────────────────── */
.builder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
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
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--builder-text-muted);
  margin: 0 0 0.75rem 0;
}

.sidebar-group {
  margin-bottom: 1.25rem;
}

.sidebar-group__title {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin: 0 0 0.5rem 0;
  padding-left: 0.25rem;
}

.sidebar-components {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sidebar-component {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: var(--builder-surface);
  border: 1px solid var(--builder-border);
  border-radius: 0.375rem;
  cursor: grab;
  transition: all 0.2s ease;
  font-size: 0.8125rem;
  color: var(--builder-text);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
  user-select: none;
}

.sidebar-component:hover {
  background: var(--builder-primary-subtle);
  border-color: var(--builder-primary);
  color: var(--builder-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
}

.sidebar-component:active {
  cursor: grabbing;
  transform: translateY(0);
}

.sidebar-component__icon {
  font-size: 1rem;
  color: var(--builder-text-muted);
  transition: color 0.2s ease;
}

.sidebar-component:hover .sidebar-component__icon {
  color: var(--builder-primary);
}

.sidebar-component__label {
  font-weight: 500;
}

/* ─── Canvas ───────────────────────────────────────────────── */
.builder-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
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

.canvas-empty__hint {
  font-size: 0.8125rem;
  color: var(--builder-text-muted);
  margin: 0;
}

/* ─── Property Editor ──────────────────────────────────────── */

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
  width: 350px;
  flex-shrink: 0;
  background: var(--builder-sidebar-bg);
  border-left: 1px solid var(--builder-border);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--builder-border);
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
}

.properties-body {
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
}

/* ─── Properties Accordion Overrides ─── */
.builder-properties :deep(.p-accordion) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--builder-sidebar-bg);
  width: 100%;
}

.builder-properties :deep(.p-accordionpanel) {
  border: none !important;
  border-bottom: 1px solid var(--builder-border) !important;
  width: 100%;
  overflow: hidden;
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

.builder-properties :deep(.p-accordioncontent-wrapper) {
  width: 100%;
  overflow: hidden;
}

.builder-properties :deep(.p-accordioncontent-content) {
  padding: 1rem;
  background: var(--builder-sidebar-bg);
  border: none !important;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
}

/* ─── Force ALL children inside properties to respect width ─── */
.builder-properties :deep(.p-accordioncontent-content *) {
  box-sizing: border-box;
  max-width: 100%;
}

/* ─── Sidebar Accordion Overrides ─── */
.builder-sidebar :deep(.p-accordionpanel) {
  border: none !important;
  margin-bottom: 0.5rem;
  background: var(--builder-surface, #ffffff);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
}

.builder-sidebar :deep(.p-accordionheader) {
  padding: 0.75rem 1rem;
  background: transparent;
  border: none !important;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-label, #374151);
  transition: background 0.2s ease;
}

.builder-sidebar :deep(.p-accordionheader:hover) {
  color: var(--builder-primary, #6366f1);
  background: var(--color-hover, #f9fafb);
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
  padding: 0; /* Let accordion handle padding to avoid double spacing & overflow */
}

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
  font-weight: 600;
  color: var(--color-placeholder, #9ca3af);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

/* ─── Wizard Preview ───────────────────────────────────────── */
.wizard-preview-wrapper {
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--builder-surface, #ffffff);
  border-radius: 0.75rem;
  border: 1px solid var(--builder-border, #e5e7eb);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}
</style>
