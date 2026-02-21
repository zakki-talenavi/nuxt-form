<script setup lang="ts">
/**
 * DayField Component
 * Day/Month/Year with separate dropdowns. Stores as MM/DD/YYYY.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)

const dayFields = computed(() => props.component.dayFirst as boolean || false)
const hideDay = computed(() => (props.component.fields as Record<string, Record<string, boolean>>)?.day?.hide || false)
const hideMonth = computed(() => (props.component.fields as Record<string, Record<string, boolean>>)?.month?.hide || false)
const hideYear = computed(() => (props.component.fields as Record<string, Record<string, boolean>>)?.year?.hide || false)

const selectedMonth = ref('')
const selectedDay = ref('')
const selectedYear = ref('')

const months = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const days = computed(() => {
  const count = selectedMonth.value
    ? new Date(Number(selectedYear.value) || 2024, Number(selectedMonth.value), 0).getDate()
    : 31
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'))
})

const currentYear = new Date().getFullYear()
const years = computed(() => {
  const arr: string[] = []
  for (let y = currentYear; y >= currentYear - 100; y--) {
    arr.push(String(y))
  }
  return arr
})

// Parse incoming value
watch(
  () => props.modelValue,
  (val) => {
    if (typeof val === 'string' && val) {
      const parts = val.split('/')
      if (parts.length === 3) {
        selectedMonth.value = parts[0]
        selectedDay.value = parts[1]
        selectedYear.value = parts[2]
      }
    }
  },
  { immediate: true },
)

function emitValue() {
  const m = selectedMonth.value || '00'
  const d = selectedDay.value || '00'
  const y = selectedYear.value || '0000'
  const val = `${m}/${d}/${y}`
  if (val === '00/00/0000') {
    emit('update:modelValue', '')
  } else {
    emit('update:modelValue', val)
  }
}

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label
      v-if="component.label"
      class="form-field__label"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="day-field__row" :class="{ 'day-field__row--day-first': dayFields }">
      <!-- Month -->
      <div v-if="!hideMonth" class="day-field__col">
        <label class="day-field__sublabel">Month</label>
        <select
          v-model="selectedMonth"
          :disabled="disabled || readOnly"
          class="form-field__input day-field__select"
          @change="emitValue"
          @blur="handleBlur"
        >
          <option value="" disabled>Month</option>
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Day -->
      <div v-if="!hideDay" class="day-field__col day-field__col--small">
        <label class="day-field__sublabel">Day</label>
        <select
          v-model="selectedDay"
          :disabled="disabled || readOnly"
          class="form-field__input day-field__select"
          @change="emitValue"
          @blur="handleBlur"
        >
          <option value="" disabled>Day</option>
          <option v-for="d in days" :key="d" :value="d">{{ Number(d) }}</option>
        </select>
      </div>

      <!-- Year -->
      <div v-if="!hideYear" class="day-field__col">
        <label class="day-field__sublabel">Year</label>
        <select
          v-model="selectedYear"
          :disabled="disabled || readOnly"
          class="form-field__input day-field__select"
          @change="emitValue"
          @blur="handleBlur"
        >
          <option value="" disabled>Year</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-field { margin-bottom: 1.25rem; }
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; letter-spacing: -0.01em; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }
.day-field__row { display: flex; gap: 0.75rem; }
.day-field__row--day-first { flex-direction: row-reverse; }
.day-field__row--day-first .day-field__col:last-child { order: 1; }
.day-field__col { flex: 1; min-width: 0; }
.day-field__col--small { flex: 0.7; }
.day-field__sublabel { display: block; font-size: 0.7rem; color: var(--color-description, #6b7280); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
.day-field__select { appearance: auto; }
.form-field__input { width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; line-height: 1.5; color: var(--color-text, #111827); background: var(--color-input-bg, #ffffff); border: 1.5px solid var(--color-border, #d1d5db); border-radius: 0.5rem; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-sizing: border-box; }
.form-field__input:focus { border-color: var(--color-primary, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.form-field__input:disabled { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }
.has-error .form-field__input { border-color: var(--color-error, #ef4444); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
