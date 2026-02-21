<script setup lang="ts">
/**
 * ========================================
 * FormWizard Component
 * ========================================
 * Multi-step form renderer with:
 * - Progress bar with step indicators
 * - Per-step validation
 * - Animated transitions between steps
 * - Breadcrumb navigation
 * - Next/Previous/Submit buttons
 */
import { computed } from 'vue'
import { useFormWizard } from '../../composables/useFormWizard'
import type {
  FormSchema,
  FormComponentSchema,
  ValidationError,
} from '../../types/form'

const props = defineProps<{
  schema: FormSchema
  formData: Record<string, unknown>
  errors: Map<string, ValidationError[]>
  showErrors: boolean
  isSubmitting: boolean
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', key: string, value: unknown): void
  (e: 'blur', key: string): void
  (e: 'submit'): void
}>()

const schemaComponents = computed(() => props.schema.components)

const wizard = useFormWizard(
  schemaComponents,
  props.formData,
  { breadcrumbClickable: true, linear: true },
)

function handleFieldUpdate(key: string, value: unknown) {
  emit('update:modelValue', key, value)
}

function handleBlur(key: string) {
  emit('blur', key)
}

function handleNext() {
  wizard.nextPage()
}

function handlePrev() {
  wizard.prevPage()
}

function handleSubmit() {
  const pageErrors = wizard.validateCurrentPage()
  if (pageErrors.length === 0) {
    emit('submit')
  }
}

function handleBreadcrumbClick(index: number) {
  wizard.goToPage(index)
}
</script>

<template>
  <div class="form-wizard">
    <!-- ─── Progress Bar ──────────────────────────────────── -->
    <div class="wizard-progress">
      <div class="wizard-progress__bar">
        <div
          class="wizard-progress__fill"
          :style="{ width: `${wizard.progress.value}%` }"
        />
      </div>
      <div class="wizard-progress__steps">
        <button
          v-for="page in wizard.pages.value"
          :key="page.key"
          class="wizard-step"
          :class="{
            'wizard-step--active': wizard.isPageCurrent(page.index),
            'wizard-step--visited': wizard.isPageVisited(page.index),
            'wizard-step--error': !wizard.isPageValid(page.index),
            'wizard-step--completed': wizard.isPageVisited(page.index) && wizard.isPageValid(page.index) && !wizard.isPageCurrent(page.index),
          }"
          @click="handleBreadcrumbClick(page.index)"
        >
          <span class="wizard-step__number">
            <template v-if="wizard.isPageVisited(page.index) && wizard.isPageValid(page.index) && !wizard.isPageCurrent(page.index)">
              ✓
            </template>
            <template v-else-if="!wizard.isPageValid(page.index)">
              !
            </template>
            <template v-else>
              {{ page.index + 1 }}
            </template>
          </span>
          <span class="wizard-step__label">{{ page.title }}</span>
        </button>
      </div>
    </div>

    <!-- ─── Page Content ──────────────────────────────────── -->
    <div class="wizard-content">
      <TransitionGroup name="wizard-page">
        <div
          v-for="page in wizard.pages.value"
          v-show="wizard.isPageCurrent(page.index)"
          :key="page.key"
          class="wizard-page"
        >
          <h2 class="wizard-page__title">{{ page.title }}</h2>

          <!-- Render components in this page -->
          <div class="wizard-page__fields">
            <slot
              name="renderComponent"
              v-for="comp in (page.component.components ?? [])"
              :component="comp"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- ─── Navigation ────────────────────────────────────── -->
    <div class="wizard-nav">
      <div class="wizard-nav__left">
        <button
          v-if="!wizard.isFirstPage.value"
          class="wizard-btn wizard-btn--secondary"
          :disabled="disabled"
          @click="handlePrev"
        >
          ← Previous
        </button>
      </div>
      <div class="wizard-nav__center">
        <span class="wizard-nav__page-info">
          Page {{ wizard.currentPage.value + 1 }} of {{ wizard.totalPages.value }}
        </span>
      </div>
      <div class="wizard-nav__right">
        <button
          v-if="!wizard.isLastPage.value"
          class="wizard-btn wizard-btn--primary"
          :disabled="disabled"
          @click="handleNext"
        >
          Next →
        </button>
        <button
          v-else
          class="wizard-btn wizard-btn--submit"
          :disabled="disabled || isSubmitting"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting" class="wizard-btn__spinner" />
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-wizard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ─── Progress Bar ──────────────────────────────────────── */
.wizard-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wizard-progress__bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.wizard-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.wizard-progress__steps {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

/* ─── Step Indicator ────────────────────────────────────── */
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  flex: 1;
  transition: all 0.2s;
}

.wizard-step__number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.wizard-step__label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  transition: color 0.2s;
}

/* Active */
.wizard-step--active .wizard-step__number {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-color: transparent;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
}

.wizard-step--active .wizard-step__label {
  color: rgba(255, 255, 255, 0.9);
}

/* Completed */
.wizard-step--completed .wizard-step__number {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-color: #22c55e;
}

.wizard-step--completed .wizard-step__label {
  color: rgba(255, 255, 255, 0.6);
}

/* Error */
.wizard-step--error .wizard-step__number {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: #ef4444;
}

.wizard-step--error .wizard-step__label {
  color: #ef4444;
}

/* Hover */
.wizard-step:hover .wizard-step__number {
  border-color: rgba(99, 102, 241, 0.5);
  transform: scale(1.08);
}

/* ─── Page Content ──────────────────────────────────────── */
.wizard-content {
  min-height: 200px;
  position: relative;
}

.wizard-page {
  animation: wizardFadeIn 0.35s ease-out;
}

.wizard-page__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.wizard-page__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@keyframes wizardFadeIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ─── Navigation ────────────────────────────────────────── */
.wizard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.wizard-nav__left,
.wizard-nav__right {
  flex: 1;
}

.wizard-nav__right {
  display: flex;
  justify-content: flex-end;
}

.wizard-nav__center {
  flex: 1;
  text-align: center;
}

.wizard-nav__page-info {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ─── Buttons ───────────────────────────────────────────── */
.wizard-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wizard-btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wizard-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.wizard-btn--primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.wizard-btn--primary:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.wizard-btn--submit {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.wizard-btn--submit:hover {
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}

.wizard-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.wizard-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Responsive ────────────────────────────────────────── */
@media (max-width: 640px) {
  .wizard-progress__steps {
    gap: 0.25rem;
  }

  .wizard-step__label {
    display: none;
  }

  .wizard-step__number {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .wizard-nav__center {
    display: none;
  }
}
</style>
