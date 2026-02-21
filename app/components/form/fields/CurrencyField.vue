<script setup lang="ts">
/**
 * CurrencyField Component
 * Formatted currency input with locale-aware prefix/suffix.
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
  'update:modelValue': [value: number | null]
  'blur': [key: string]
}>()

const displayValue = ref('')
const isFocused = ref(false)

const hasErrors = computed(() => props.errors.length > 0)
const decimalLimit = computed(() => (props.component.decimalLimit as number) ?? 2)
const currencyCode = computed(() => (props.component.currency as string) || 'USD')

const currencySymbol = computed(() => {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
    KRW: '₩', INR: '₹', IDR: 'Rp', BRL: 'R$', RUB: '₽',
    AUD: 'A$', CAD: 'C$', CHF: 'CHF', SEK: 'kr', NOK: 'kr',
    MXN: 'MX$', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', THB: '฿',
  }
  return symbols[currencyCode.value] || currencyCode.value
})

function formatCurrency(num: number): string {
  const fixed = num.toFixed(decimalLimit.value)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currencySymbol.value}${withCommas}${decPart ? '.' + decPart : ''}`
}

function parseRawValue(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.\-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

watch(
  () => props.modelValue,
  (val) => {
    if (!isFocused.value) {
      if (val === null || val === undefined || val === '') {
        displayValue.value = ''
      } else {
        displayValue.value = formatCurrency(Number(val))
      }
    }
  },
  { immediate: true },
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  displayValue.value = target.value
  emit('update:modelValue', parseRawValue(target.value))
}

function handleFocus() {
  isFocused.value = true
  // Show raw number on focus for editing
  const num = parseRawValue(displayValue.value)
  if (num !== null) {
    displayValue.value = String(num)
  }
}

function handleBlur() {
  isFocused.value = false
  const num = parseRawValue(displayValue.value)
  if (num !== null) {
    displayValue.value = formatCurrency(num)
    emit('update:modelValue', num)
  } else {
    displayValue.value = ''
  }
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label
      v-if="component.label"
      :for="`field-${component.key}`"
      class="form-field__label"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="form-field__currency-wrap">
      <span v-if="!isFocused && !displayValue" class="form-field__prefix">{{ currencySymbol }}</span>
      <input
        :id="`field-${component.key}`"
        :value="displayValue"
        type="text"
        :placeholder="`${currencySymbol}0.${'0'.repeat(decimalLimit)}`"
        :disabled="disabled || readOnly"
        :readonly="readOnly"
        :required="component.validate?.required"
        :class="['form-field__input', component.customClass]"
        autocomplete="off"
        inputmode="decimal"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
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
.form-field__currency-wrap { position: relative; }
.form-field__prefix { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); font-size: 0.875rem; color: var(--color-placeholder, #9ca3af); pointer-events: none; }
.form-field__input { width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; line-height: 1.5; color: var(--color-text, #111827); background: var(--color-input-bg, #ffffff); border: 1.5px solid var(--color-border, #d1d5db); border-radius: 0.5rem; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-sizing: border-box; font-variant-numeric: tabular-nums; }
.form-field__input:focus { border-color: var(--color-primary, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.form-field__input::placeholder { color: var(--color-placeholder, #9ca3af); }
.form-field__input:disabled { background: var(--color-disabled-bg, #f3f4f6); cursor: not-allowed; opacity: 0.7; }
.has-error .form-field__input { border-color: var(--color-error, #ef4444); }
.has-error .form-field__input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
