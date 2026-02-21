<script setup lang="ts">
/**
 * ButtonField Component
 * Form button with configurable actions (submit, reset, event).
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
  'update:modelValue': [value: boolean]
  'blur': [key: string]
}>()

const action = computed(() => (props.component.action as string) || 'submit')
const theme = computed(() => (props.component.theme as string) || 'primary')
const isBlock = computed(() => (props.component.block as boolean) || false)
const disableOnInvalid = computed(() => (props.component.disableOnInvalid as boolean) || false)
const leftIcon = computed(() => (props.component.leftIcon as string) || '')
const rightIcon = computed(() => (props.component.rightIcon as string) || '')

const themeClasses: Record<string, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  info: 'btn--info',
  success: 'btn--success',
  danger: 'btn--danger',
  warning: 'btn--warning',
}

function handleClick() {
  if (props.disabled || props.readOnly) return
  if (action.value === 'submit') {
    emit('update:modelValue', true)
  } else if (action.value === 'reset') {
    emit('update:modelValue', false)
  } else if (action.value === 'event') {
    emit('update:modelValue', true)
  }
}
</script>

<template>
  <div class="form-field button-field" :class="{ 'button-field--block': isBlock }">
    <button
      :type="action === 'submit' ? 'submit' : 'button'"
      :disabled="disabled || (disableOnInvalid && disabled)"
      :class="['btn', themeClasses[theme] || 'btn--primary', component.customClass]"
      @click="handleClick"
    >
      <span v-if="leftIcon" class="btn__icon btn__icon--left">{{ leftIcon }}</span>
      {{ component.label || 'Submit' }}
      <span v-if="rightIcon" class="btn__icon btn__icon--right">{{ rightIcon }}</span>
    </button>
  </div>
</template>

<style scoped>
.button-field { margin-bottom: 1.25rem; }
.button-field--block .btn { width: 100%; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 600;
  border: none; border-radius: 0.5rem; cursor: pointer;
  transition: all 0.2s ease; line-height: 1.5;
  letter-spacing: -0.01em;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.98); }

.btn--primary { background: var(--color-primary, #6366f1); color: white; }
.btn--primary:hover:not(:disabled) { background: #5558e6; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }

.btn--secondary { background: var(--color-border, #e5e7eb); color: var(--color-text, #374151); }
.btn--secondary:hover:not(:disabled) { background: #d1d5db; }

.btn--success { background: #10b981; color: white; }
.btn--success:hover:not(:disabled) { background: #059669; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

.btn--danger { background: #ef4444; color: white; }
.btn--danger:hover:not(:disabled) { background: #dc2626; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }

.btn--warning { background: #f59e0b; color: white; }
.btn--warning:hover:not(:disabled) { background: #d97706; box-shadow: 0 4px 12px rgba(245,158,11,0.3); }

.btn--info { background: #3b82f6; color: white; }
.btn--info:hover:not(:disabled) { background: #2563eb; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }

.btn__icon { font-size: 1rem; }
</style>
