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
        <Select
          v-model="selectedMonth"
          :options="months"
          optionLabel="label"
          optionValue="value"
          placeholder="Month"
          :disabled="disabled || readOnly"
          :invalid="hasErrors"
          fluid
          class="w-full"
          @change="emitValue"
          @blur="handleBlur"
        />
      </div>

      <!-- Day -->
      <div v-if="!hideDay" class="day-field__col day-field__col--small">
        <label class="day-field__sublabel">Day</label>
        <Select
          v-model="selectedDay"
          :options="days"
          placeholder="Day"
          :disabled="disabled || readOnly"
          :invalid="hasErrors"
          fluid
          class="w-full"
          @change="emitValue"
          @blur="handleBlur"
        />
      </div>

      <!-- Year -->
      <div v-if="!hideYear" class="day-field__col">
        <label class="day-field__sublabel">Year</label>
        <Select
          v-model="selectedYear"
          :options="years"
          placeholder="Year"
          :disabled="disabled || readOnly"
          :invalid="hasErrors"
          fluid
          class="w-full"
          @change="emitValue"
          @blur="handleBlur"
        />
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

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
