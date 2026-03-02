<script lang="ts">
export default {
  name: 'WizardBuilderCanvas'
}
</script>

<script setup lang="ts">
/**
 * ========================================
 * WizardBuilderCanvas Component
 * ========================================
 * Wizard page management UI for the form builder:
 * - Page tab bar with add/remove/rename/reorder
 * - Per-page drop zone (reuses BuilderDropZone)
 * - Page info footer
 */
import { ref, computed, inject, nextTick } from 'vue'
import type { FormComponentSchema } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import BuilderDropZone from './BuilderDropZone.vue'
import { useConfirm } from 'primevue/useconfirm'

const builder = inject('formBuilder') as ReturnType<typeof useFormBuilder>
if (!builder) {
  throw new Error('WizardBuilderCanvas must be used within a FormBuilder component')
}

const confirm = useConfirm()

// ─── Inline Rename ─────────────────────────────────────────
const editingPageKey = ref<string | null>(null)
const editingTitle = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

function startRename(page: FormComponentSchema) {
  editingPageKey.value = page.key
  editingTitle.value = (page.title as string) || page.label || ''
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

function commitRename() {
  if (editingPageKey.value && editingTitle.value.trim()) {
    builder.renameWizardPage(editingPageKey.value, editingTitle.value.trim())
  }
  editingPageKey.value = null
  editingTitle.value = ''
}

function cancelRename() {
  editingPageKey.value = null
  editingTitle.value = ''
}

// ─── Delete Page ───────────────────────────────────────────
function confirmDeletePage(page: FormComponentSchema) {
  const pageTitle = page.title || page.label || 'this page'
  const hasComponents = Array.isArray(page.components) && page.components.length > 0
  
  const msg = hasComponents 
    ? `Are you sure you want to delete "${pageTitle}" and all its components?` 
    : `Are you sure you want to delete "${pageTitle}"?`

  confirm.require({
    header: 'Delete Page',
    message: msg,
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      builder.removeWizardPage(page.key)
    }
  })
}

// ─── Tab DnD ───────────────────────────────────────────────
const dragTabIndex = ref<number | null>(null)
const dragOverTabIndex = ref<number | null>(null)

function handleTabDragStart(index: number, event: DragEvent) {
  dragTabIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `wizard-tab:${index}`)
  }
}

function handleTabDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  dragOverTabIndex.value = index
}

function handleTabDrop(index: number, event: DragEvent) {
  event.preventDefault()
  if (dragTabIndex.value !== null && dragTabIndex.value !== index) {
    builder.reorderWizardPages(dragTabIndex.value, index)
  }
  dragTabIndex.value = null
  dragOverTabIndex.value = null
}

function handleTabDragEnd() {
  dragTabIndex.value = null
  dragOverTabIndex.value = null
}

// ─── Active page components ────────────────────────────────
const activePageComponents = computed(() => {
  return builder.activeWizardPage.value?.components ?? []
})
</script>

<template>
  <div class="wizard-builder">
    <!-- ─── Page Tab Bar ──────────────────────────────────── -->
    <div class="wizard-tabs">
      <div class="wizard-tabs__list">
        <div
          v-for="(page, index) in builder.wizardPages.value"
          :key="page.key"
          class="wizard-tab"
          :class="{
            'wizard-tab--active': builder.activeWizardPageIndex.value === index,
            'wizard-tab--drag-over': dragOverTabIndex === index,
            'wizard-tab--dragging': dragTabIndex === index,
          }"
          draggable="true"
          @click="builder.setActiveWizardPage(index)"
          @dragstart="handleTabDragStart(index, $event)"
          @dragover="handleTabDragOver(index, $event)"
          @drop="handleTabDrop(index, $event)"
          @dragend="handleTabDragEnd"
        >
          <span class="wizard-tab__number">{{ index + 1 }}</span>

          <!-- Edit mode -->
          <input
            v-if="editingPageKey === page.key"
            ref="renameInput"
            v-model="editingTitle"
            class="wizard-tab__rename-input"
            @blur="commitRename"
            @keydown.enter="commitRename"
            @keydown.escape="cancelRename"
            @click.stop
          />
          <!-- Display mode -->
          <span
            v-else
            class="wizard-tab__title"
            @dblclick.stop="startRename(page)"
          >
            {{ page.title || page.label || `Page ${index + 1}` }}
          </span>

          <!-- Delete button (only if more than 1 page) -->
          <button
            v-if="builder.wizardPages.value.length > 1"
            class="wizard-tab__delete"
            title="Remove page"
            @click.stop="confirmDeletePage(page)"
          >
            ✕
          </button>
        </div>
      </div>

      <button
        class="wizard-tabs__add"
        title="Add new page"
        @click="builder.addWizardPage()"
      >
        + Add Page
      </button>
    </div>

    <!-- ─── Active Page Content ───────────────────────────── -->
    <div class="wizard-builder__content">
      <div v-if="builder.activeWizardPage.value" class="wizard-builder__page">
        <div class="wizard-builder__page-header">
          <h3 class="wizard-builder__page-title">
            {{ builder.activeWizardPage.value.title || builder.activeWizardPage.value.label }}
          </h3>
          <span class="wizard-builder__page-hint">
            Drag components from the sidebar into this page
          </span>
        </div>
        <BuilderDropZone :list="activePageComponents" />
      </div>
      <div v-else class="wizard-builder__empty">
        <p>No pages available. Click "+ Add Page" to get started.</p>
      </div>
    </div>

    <!-- ─── Page Footer ───────────────────────────────────── -->
    <div class="wizard-builder__footer">
      <span class="wizard-builder__page-info">
        Page {{ builder.activeWizardPageIndex.value + 1 }} of {{ builder.wizardPages.value.length }}
      </span>
    </div>

    <!-- ─── Confirm Dialog ────────────────────────────────── -->
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.wizard-builder {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* ─── Tab Bar ──────────────────────────────────────────────── */
.wizard-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0;
  background: var(--builder-surface, #ffffff);
  border-bottom: 1px solid var(--builder-border, #e5e7eb);
  overflow-x: auto;
}

.wizard-tabs__list {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.wizard-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--builder-surface-hover, #f8fafc);
  border: 1px solid var(--builder-border, #e5e7eb);
  border-bottom: none;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  font-size: 0.8125rem;
  color: var(--builder-text-muted, #64748b);
  white-space: nowrap;
  position: relative;
}

.wizard-tab:hover {
  background: #eef2ff;
  color: var(--builder-primary, #6366f1);
}

.wizard-tab--active {
  background: var(--builder-surface, #ffffff);
  color: var(--builder-primary, #6366f1);
  font-weight: 600;
  border-color: var(--builder-primary, #6366f1);
  border-bottom: 2px solid var(--builder-surface, #ffffff);
  margin-bottom: -1px;
  z-index: 1;
}

.wizard-tab--drag-over {
  border-left: 3px solid var(--builder-primary, #6366f1);
}

.wizard-tab--dragging {
  opacity: 0.4;
}

.wizard-tab__number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--builder-border, #e5e7eb);
  color: var(--builder-text-muted, #64748b);
  flex-shrink: 0;
  transition: all 0.2s;
}

.wizard-tab--active .wizard-tab__number {
  background: var(--builder-primary, #6366f1);
  color: #ffffff;
}

.wizard-tab__title {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.wizard-tab__rename-input {
  width: 120px;
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  border: 1px solid var(--builder-primary, #6366f1);
  border-radius: 0.25rem;
  outline: none;
  font-family: inherit;
  background: #ffffff;
  color: var(--builder-text, #0f172a);
}

.wizard-tab__delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--builder-text-muted, #64748b);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  opacity: 0;
  transition: all 0.15s;
  line-height: 1;
}

.wizard-tab:hover .wizard-tab__delete {
  opacity: 1;
}

.wizard-tab__delete:hover {
  background: #fef2f2;
  color: var(--builder-danger, #ef4444);
}

/* ─── Add Page Button ──────────────────────────────────────── */
.wizard-tabs__add {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px dashed var(--builder-border, #e5e7eb);
  border-radius: 0.5rem 0.5rem 0 0;
  border-bottom: none;
  background: transparent;
  color: var(--builder-primary, #6366f1);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
  flex-shrink: 0;
}

.wizard-tabs__add:hover {
  background: #eef2ff;
  border-color: var(--builder-primary, #6366f1);
}

/* ─── Page Content ─────────────────────────────────────────── */
.wizard-builder__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.wizard-builder__page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wizard-builder__page-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--builder-border, #e5e7eb);
}

.wizard-builder__page-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--builder-text, #0f172a);
  margin: 0;
}

.wizard-builder__page-hint {
  font-size: 0.75rem;
  color: var(--builder-text-muted, #64748b);
}

.wizard-builder__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--builder-text-muted, #64748b);
  font-size: 0.875rem;
}

/* ─── Footer ───────────────────────────────────────────────── */
.wizard-builder__footer {
  display: flex;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--builder-border, #e5e7eb);
  background: var(--builder-surface, #ffffff);
}

.wizard-builder__page-info {
  font-size: 0.75rem;
  color: var(--builder-text-muted, #64748b);
  font-weight: 500;
}

</style>
