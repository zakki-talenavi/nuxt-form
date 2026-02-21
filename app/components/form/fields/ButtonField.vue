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

const severity = computed(() => {
  const t = theme.value
  if (t === 'primary') return undefined // PrimeVue default
  if (t === 'warning') return 'warn'
  return t
})

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
    <Button
      :type="action === 'submit' ? 'submit' : 'button'"
      :disabled="disabled || (disableOnInvalid && disabled)"
      :severity="severity"
      :fluid="isBlock"
      :class="component.customClass"
      @click="handleClick"
    >
      <span v-if="leftIcon" class="btn__icon btn__icon--left mr-2">{{ leftIcon }}</span>
      <span>{{ component.label || 'Submit' }}</span>
      <span v-if="rightIcon" class="btn__icon btn__icon--right ml-2">{{ rightIcon }}</span>
    </Button>
  </div>
</template>

<style scoped>
.button-field { margin-bottom: 1.25rem; }
.btn__icon { font-size: 1rem; }
</style>
