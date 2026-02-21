<script setup lang="ts">
/**
 * Survey Component
 * Questions × Values matrix (likert scale).
 * Renders a table with questions as rows and values as columns,
 * using radio buttons for single-answer-per-question.
 */
import { computed } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface SurveyQuestion {
  label: string
  value: string
}

interface SurveyValue {
  label: string
  value: string
}

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
  'blur': [key: string]
}>()

const surveyData = computed<Record<string, string>>({
  get: () => {
    const val = props.modelValue
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, string>
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val),
})

const questions = computed<SurveyQuestion[]>(() => {
  return ((props.component as Record<string, unknown>).questions as SurveyQuestion[]) ?? []
})

const values = computed<SurveyValue[]>(() => {
  return ((props.component as Record<string, unknown>).values as SurveyValue[]) ?? []
})

const hasErrors = computed(() => props.errors.length > 0)

function selectAnswer(questionValue: string, answerValue: string) {
  if (props.disabled || props.readOnly) return
  const newData = { ...surveyData.value, [questionValue]: answerValue }
  emit('update:modelValue', newData)
}

function isSelected(questionValue: string, answerValue: string): boolean {
  return surveyData.value[questionValue] === answerValue
}

function getCompletionCount(): number {
  return questions.value.filter(q => surveyData.value[q.value]).length
}
</script>

<template>
  <div class="form-field survey-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <!-- Progress indicator -->
    <div class="survey-progress">
      <span class="survey-progress__text">
        {{ getCompletionCount() }} of {{ questions.length }} answered
      </span>
      <div class="survey-progress__bar">
        <div
          class="survey-progress__fill"
          :style="{ width: `${questions.length > 0 ? (getCompletionCount() / questions.length) * 100 : 0}%` }"
        />
      </div>
    </div>

    <div class="survey-table-wrapper">
      <table class="survey-table">
        <thead>
          <tr>
            <th class="survey-th survey-th--question">Question</th>
            <th
              v-for="val in values"
              :key="val.value"
              class="survey-th survey-th--value"
            >
              {{ val.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="question in questions"
            :key="question.value"
            class="survey-row"
            :class="{ 'is-answered': surveyData[question.value] }"
          >
            <td class="survey-td survey-td--question">
              {{ question.label }}
            </td>
            <td
              v-for="val in values"
              :key="val.value"
              class="survey-td survey-td--value"
            >
              <div class="flex justify-center">
                <RadioButton
                  :inputId="`survey-${component.key}-${question.value}-${val.value}`"
                  :name="`survey-${component.key}-${question.value}`"
                  :value="val.value"
                  :modelValue="surveyData[question.value]"
                  :disabled="disabled || readOnly"
                  @update:modelValue="selectAnswer(question.value, $event)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.survey-field {
  margin-bottom: 1.25rem;
}

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.5rem;
}

.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

.survey-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.survey-progress__text {
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  white-space: nowrap;
}

.survey-progress__bar {
  flex: 1;
  height: 4px;
  background: var(--color-border, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.survey-progress__fill {
  height: 100%;
  background: var(--color-primary, #6366f1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.survey-table-wrapper {
  overflow-x: auto;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  background: var(--color-input-bg, #ffffff);
}

.survey-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.survey-th {
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--color-label, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-table-header, #f9fafb);
  border-bottom: 1.5px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}

.survey-th--question {
  text-align: left;
  min-width: 12rem;
}

.survey-th--value {
  text-align: center;
  min-width: 5rem;
}

.survey-row {
  transition: background 0.15s ease;
}

.survey-row:hover {
  background: var(--color-hover, #f9fafb);
}

.survey-row.is-answered {
  background: rgba(99, 102, 241, 0.02);
}

.survey-td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
  vertical-align: middle;
}

.survey-td--question {
  font-weight: 500;
  color: var(--color-text, #374151);
}

.survey-td--value {
  text-align: center;
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
