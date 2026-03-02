<script setup lang="ts">
/**
 * ========================================
 * WizardPreview Component
 * ========================================
 * Lightweight wizard preview for the Form Builder.
 * Renders the wizard pages with stepper UI, navigation,
 * and live field rendering — directly from the builder schema.
 */
import { ref, computed, inject } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'
import { useFormBuilder } from '../../composables/useFormBuilder'
import { useComponentRegistry } from '../../composables/useComponentRegistry'

const builder = inject('formBuilder') as ReturnType<typeof useFormBuilder>
if (!builder) {
  throw new Error('WizardPreview must be used within a FormBuilder component')
}

const registry = useComponentRegistry()

// ─── Layout types ─────────────────────────────────────────────
const layoutTypes = new Set(['columns', 'fieldset', 'panel', 'well', 'table', 'tabs', 'container', 'tree'])

function isLayoutComponent(type: string): boolean {
  return layoutTypes.has(type)
}

// ─── Local wizard state ───────────────────────────────────────
const currentPage = ref(0)
const previewData = ref<Record<string, unknown>>({})
const pageErrors = ref<Record<string, string>>({})

const pages = computed(() => {
  return builder.wizardPages.value.map((panel, index) => ({
    index,
    title: (panel.title as string) || panel.label || `Page ${index + 1}`,
    key: panel.key,
    components: panel.components ?? [],
  }))
})

const totalPages = computed(() => pages.value.length)
const isFirstPage = computed(() => currentPage.value === 0)
const isLastPage = computed(() => currentPage.value === totalPages.value - 1)
const activePage = computed(() => pages.value[currentPage.value] ?? null)

const progress = computed(() => {
  if (totalPages.value <= 1) return 100
  return Math.round((currentPage.value / (totalPages.value - 1)) * 100)
})

// ─── Validation helpers ───────────────────────────────────────
function collectInputComponents(components: FormComponentSchema[]): FormComponentSchema[] {
  const result: FormComponentSchema[] = []
  for (const comp of components) {
    if (layoutTypes.has(comp.type)) {
      // Recurse into layout children
      if (comp.components) {
        result.push(...collectInputComponents(comp.components))
      }
      if (comp.columns) {
        for (const col of comp.columns) {
          if (col.components) {
            result.push(...collectInputComponents(col.components))
          }
        }
      }
    } else {
      result.push(comp)
    }
  }
  return result
}

function isFieldEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function validateCurrentPage(): boolean {
  if (!activePage.value) return true
  const errors: Record<string, string> = {}
  const inputs = collectInputComponents(activePage.value.components)

  for (const comp of inputs) {
    if (comp.validate?.required && isFieldEmpty(previewData.value[comp.key])) {
      const label = comp.label || comp.key
      errors[comp.key] = `${label} wajib diisi`
    }
  }

  pageErrors.value = errors
  return Object.keys(errors).length === 0
}

function getFieldErrors(key: string): ValidationError[] {
  const msg = pageErrors.value[key]
  if (!msg) return []
  return [{ key, message: msg, type: 'required' }]
}

function nextPage() {
  if (!validateCurrentPage()) return
  if (!isLastPage.value) {
    currentPage.value++
    pageErrors.value = {}
  }
}

function prevPage() {
  if (!isFirstPage.value) {
    currentPage.value--
  }
}

function goToPage(index: number) {
  // Only allow going to previous pages freely; forward requires validation
  if (index >= 0 && index < totalPages.value) {
    if (index > currentPage.value) {
      if (!validateCurrentPage()) return
    }
    currentPage.value = index
    pageErrors.value = {}
  }
}

function handleFieldUpdate(key: string, value: unknown) {
  previewData.value = { ...previewData.value, [key]: value }
  // Clear error for this field when user fills it
  if (pageErrors.value[key] && !isFieldEmpty(value)) {
    const { [key]: _, ...rest } = pageErrors.value
    pageErrors.value = rest
  }
}
</script>

<template>
  <div class="wizard-preview">
    <!-- ─── Progress Bar ──────────────────────────────────── -->
    <div class="wp-progress">
      <div class="wp-progress__bar">
        <div
          class="wp-progress__fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- ─── Step Indicators ───────────────────────────────── -->
    <div class="wp-steps">
      <button
        v-for="page in pages"
        :key="page.key"
        class="wp-step"
        :class="{
          'wp-step--active': currentPage === page.index,
          'wp-step--done': page.index < currentPage,
        }"
        @click="goToPage(page.index)"
      >
        <span class="wp-step__number">
          <template v-if="page.index < currentPage">✓</template>
          <template v-else>{{ page.index + 1 }}</template>
        </span>
        <span class="wp-step__label">{{ page.title }}</span>
      </button>
    </div>

    <!-- ─── Page Content ──────────────────────────────────── -->
    <div v-if="activePage" class="wp-page">
      <h3 class="wp-page__title">{{ activePage.title }}</h3>

      <div class="wp-page__fields">
        <template v-for="comp in activePage.components" :key="comp.key">
          <!-- Layout components -->
          <component
            v-if="registry.getComponent(comp.type) && isLayoutComponent(comp.type)"
            :is="registry.getComponent(comp.type)"
            :component="comp"
            :model-value="previewData[comp.key]"
            :errors="getFieldErrors(comp.key)"
            :disabled="false"
            :read-only="false"
            @update:model-value="(val: unknown) => handleFieldUpdate(comp.key, val)"
          >
            <template #renderComponent="{ component: childComp }">
              <component
                v-if="registry.getComponent(childComp.type)"
                :is="registry.getComponent(childComp.type)"
                :component="childComp"
                :model-value="previewData[childComp.key]"
                :errors="getFieldErrors(childComp.key)"
                :disabled="false"
                :read-only="false"
                @update:model-value="(val: unknown) => handleFieldUpdate(childComp.key, val)"
              />
            </template>
          </component>
          <!-- Regular fields -->
          <component
            v-else-if="registry.getComponent(comp.type)"
            :is="registry.getComponent(comp.type)"
            :component="comp"
            :model-value="previewData[comp.key]"
            :errors="getFieldErrors(comp.key)"
            :disabled="false"
            :read-only="false"
            @update:model-value="(val: unknown) => handleFieldUpdate(comp.key, val)"
          />
        </template>
      </div>
    </div>

    <div v-else class="wp-empty">
      <p>No pages available.</p>
    </div>

    <!-- ─── Navigation ────────────────────────────────────── -->
    <div class="wp-nav">
      <button
        v-if="!isFirstPage"
        class="wp-btn wp-btn--secondary"
        @click="prevPage"
      >
        ← Previous
      </button>
      <div v-else />

      <span class="wp-nav__info">
        Page {{ currentPage + 1 }} of {{ totalPages }}
      </span>

      <button
        v-if="!isLastPage"
        class="wp-btn wp-btn--primary"
        @click="nextPage"
      >
        Next →
      </button>
      <button
        v-else
        class="wp-btn wp-btn--submit"
      >
        Submit
      </button>
    </div>
  </div>
</template>

<style scoped>
.wizard-preview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

/* ─── Progress ─────────────────────────────────────────────── */
.wp-progress__bar {
  height: 4px;
  background: var(--builder-border, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
}

.wp-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--builder-primary, #6366f1), #8b5cf6);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─── Steps ────────────────────────────────────────────────── */
.wp-steps {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.wp-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s;
}

.wp-step__number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--builder-surface-hover, #f1f5f9);
  color: var(--builder-text-muted, #64748b);
  border: 2px solid var(--builder-border, #e5e7eb);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.wp-step__label {
  font-size: 0.75rem;
  color: var(--builder-text-muted, #64748b);
  text-align: center;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

/* Active step */
.wp-step--active .wp-step__number {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-color: transparent;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
}

.wp-step--active .wp-step__label {
  color: var(--builder-primary, #6366f1);
  font-weight: 600;
}

/* Done step */
.wp-step--done .wp-step__number {
  background: #f0fdf4;
  color: #22c55e;
  border-color: #22c55e;
}

.wp-step--done .wp-step__label {
  color: var(--builder-text, #0f172a);
}

/* Hover */
.wp-step:hover .wp-step__number {
  border-color: var(--builder-primary, #6366f1);
  transform: scale(1.08);
}

/* ─── Page Content ─────────────────────────────────────────── */
.wp-page {
  min-height: 200px;
  animation: wpFadeIn 0.3s ease-out;
}

.wp-page__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--builder-text, #0f172a);
  margin: 0 0 1.25rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--builder-border, #e5e7eb);
}

.wp-page__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@keyframes wpFadeIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.wp-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--builder-text-muted, #64748b);
  font-size: 0.875rem;
}

/* ─── Navigation ───────────────────────────────────────────── */
.wp-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.25rem;
  border-top: 1px solid var(--builder-border, #e5e7eb);
}

.wp-nav__info {
  font-size: 0.8125rem;
  color: var(--builder-text-muted, #64748b);
  font-weight: 500;
}

/* ─── Buttons ──────────────────────────────────────────────── */
.wp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.wp-btn--secondary {
  background: var(--builder-surface-hover, #f1f5f9);
  color: var(--builder-text, #0f172a);
  border: 1px solid var(--builder-border, #e5e7eb);
}

.wp-btn--secondary:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.wp-btn--primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.wp-btn--primary:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.wp-btn--submit {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.wp-btn--submit:hover {
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}
</style>
