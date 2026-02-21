<script setup lang="ts">
/**
 * FileField Component
 * File upload with drag & drop zone and image preview.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface FileInfo { name: string; size: number; type: string; url: string }

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FileInfo[] | FileInfo | null]
  'blur': [key: string]
}>()

const hasErrors = computed(() => props.errors.length > 0)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isMultiple = computed(() => props.component.multiple || false)

const files = computed<FileInfo[]>(() => {
  const val = props.modelValue
  if (!val) return []
  if (Array.isArray(val)) return val as FileInfo[]
  return [val as FileInfo]
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function isImage(type: string): boolean {
  return type.startsWith('image/')
}

function openPicker() {
  if (props.disabled || props.readOnly) return
  fileInput.value?.click()
}

async function processFiles(fileList: FileList) {
  const results: FileInfo[] = []
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    const url = await readAsDataURL(file)
    results.push({ name: file.name, size: file.size, type: file.type, url })
  }

  if (isMultiple.value) {
    emit('update:modelValue', [...files.value, ...results])
  } else {
    emit('update:modelValue', results[0] || null)
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) processFiles(target.files)
  target.value = ''
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) processFiles(event.dataTransfer.files)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function removeFile(index: number) {
  if (props.disabled || props.readOnly) return
  const updated = [...files.value]
  updated.splice(index, 1)
  if (isMultiple.value) {
    emit('update:modelValue', updated)
  } else {
    emit('update:modelValue', null)
  }
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

    <input
      ref="fileInput"
      type="file"
      :multiple="isMultiple"
      class="file-field__hidden"
      @change="handleFileChange"
    />

    <div
      v-if="!disabled && !readOnly"
      class="file-field__dropzone"
      :class="{ 'file-field__dropzone--active': isDragging }"
      @click="openPicker"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="file-field__dropzone-content">
        <span class="file-field__icon">📁</span>
        <p class="file-field__text">
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p class="file-field__hint">
          {{ isMultiple ? 'Multiple files allowed' : 'Single file only' }}
        </p>
      </div>
    </div>

    <!-- File list -->
    <div v-if="files.length" class="file-field__list">
      <div v-for="(file, idx) in files" :key="`${file.name}-${idx}`" class="file-field__item">
        <img
          v-if="isImage(file.type)"
          :src="file.url"
          :alt="file.name"
          class="file-field__preview"
        />
        <span v-else class="file-field__file-icon">📄</span>
        <div class="file-field__info">
          <span class="file-field__name">{{ file.name }}</span>
          <span class="file-field__size">{{ formatSize(file.size) }}</span>
        </div>
        <button
          v-if="!disabled && !readOnly"
          type="button"
          class="file-field__remove"
          @click="removeFile(idx)"
        >✕</button>
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
.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.375rem; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.375rem 0; }
.file-field__hidden { display: none; }

.file-field__dropzone {
  border: 2px dashed var(--color-border, #d1d5db); border-radius: 0.5rem;
  padding: 1.5rem; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--color-input-bg, #ffffff);
}
.file-field__dropzone:hover { border-color: var(--color-primary, #6366f1); background: rgba(99,102,241,0.03); }
.file-field__dropzone--active { border-color: var(--color-primary, #6366f1); background: rgba(99,102,241,0.06); }
.file-field__icon { font-size: 1.5rem; }
.file-field__text { font-size: 0.875rem; color: var(--color-text, #111827); margin: 0.5rem 0 0.25rem; }
.file-field__hint { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0; }

.file-field__list { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.file-field__item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem; border-radius: 0.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-input-bg, #fafafa);
}
.file-field__preview { width: 2.5rem; height: 2.5rem; object-fit: cover; border-radius: 0.375rem; }
.file-field__file-icon { font-size: 1.5rem; }
.file-field__info { flex: 1; min-width: 0; }
.file-field__name { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--color-text, #111827); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-field__size { font-size: 0.7rem; color: var(--color-description, #6b7280); }
.file-field__remove { background: none; border: none; cursor: pointer; color: var(--color-error, #ef4444); font-size: 0.875rem; padding: 0.25rem; opacity: 0.6; transition: opacity 0.15s; }
.file-field__remove:hover { opacity: 1; }

.has-error .file-field__dropzone { border-color: var(--color-error, #ef4444); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
