<script setup lang="ts">
/**
 * SignatureField Component
 * Canvas-based signature pad with draw/clear/undo.
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
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasSignature = ref(false)
const penColor = computed(() => (props.component.penColor as string) || '#000000')
const backgroundColor = computed(() => (props.component.backgroundColor as string) || '#ffffff')
const width = computed(() => (props.component.width as string) || '100%')
const height = computed(() => (props.component.height as string) || '150px')

let ctx: CanvasRenderingContext2D | null = null

onMounted(() => {
  initCanvas()
  // Restore existing signature
  if (props.modelValue && typeof props.modelValue === 'string' && props.modelValue.startsWith('data:')) {
    const img = new Image()
    img.onload = () => {
      ctx?.drawImage(img, 0, 0)
      hasSignature.value = true
    }
    img.src = props.modelValue
  }
})

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = penColor.value
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
}

function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  if ('touches' in e) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
  }
  return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
}

function startDraw(e: MouseEvent | TouchEvent) {
  if (props.disabled || props.readOnly || !ctx) return
  isDrawing.value = true
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx) return
  e.preventDefault()
  const pos = getPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  hasSignature.value = true
}

function endDraw() {
  if (!isDrawing.value) return
  isDrawing.value = false
  saveSignature()
}

function saveSignature() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  emit('update:modelValue', dataUrl)
}

function clearSignature() {
  if (!ctx || !canvasRef.value) return
  ctx.fillStyle = backgroundColor.value
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.strokeStyle = penColor.value
  hasSignature.value = false
  emit('update:modelValue', '')
}

function handleBlur() {
  emit('blur', props.component.key)
}
</script>

<template>
  <div class="form-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div class="signature-pad" :style="{ width, height }">
      <canvas
        ref="canvasRef"
        class="signature-pad__canvas"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.passive="startDraw"
        @touchmove="draw"
        @touchend="endDraw"
        @blur="handleBlur"
      />
      <div v-if="!hasSignature && !disabled && !readOnly" class="signature-pad__placeholder">
        Sign here
      </div>
      <button
        v-if="hasSignature && !disabled && !readOnly"
        type="button"
        class="signature-pad__clear"
        @click="clearSignature"
      >
        ✕ Clear
      </button>
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
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }

.signature-pad { position: relative; border: 1.5px solid var(--color-border, #d1d5db); border-radius: 0.5rem; overflow: hidden; background: #ffffff; }
.signature-pad__canvas { width: 100%; height: 100%; cursor: crosshair; display: block; touch-action: none; }
.signature-pad__placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--color-placeholder, #9ca3af); font-size: 0.875rem; pointer-events: none; font-style: italic; }
.signature-pad__clear { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 0.375rem; padding: 0.25rem 0.625rem; font-size: 0.75rem; cursor: pointer; color: var(--color-text, #374151); transition: background 0.15s; }
.signature-pad__clear:hover { background: rgba(0,0,0,0.1); }

.has-error .signature-pad { border-color: var(--color-error, #ef4444); }
.is-disabled .signature-pad__canvas { cursor: not-allowed; opacity: 0.7; }

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
