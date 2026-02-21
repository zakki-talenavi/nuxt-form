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
const fileUploadRef = ref<any>(null)
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

async function onUpload(event: any) {
  if (event.files) {
    await processFiles(event.files)
  }
  if (fileUploadRef.value) {
    fileUploadRef.value.clear()
  }
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

    <FileUpload
      v-if="!disabled && !readOnly"
      ref="fileUploadRef"
      mode="advanced"
      :multiple="isMultiple"
      customUpload
      auto
      :showUploadButton="false"
      :showCancelButton="false"
      chooseLabel="Browse"
      @uploader="onUpload"
      class="w-full mb-3 pb-0"
    >
      <template #empty>
        <div class="flex items-center justify-center flex-col py-4">
          <p class="m-0 text-gray-500 font-medium text-sm">
            {{ isMultiple ? 'Drag and drop files here to upload.' : 'Drag and drop a file here to upload.' }}
          </p>
        </div>
      </template>
    </FileUpload>

    <!-- File list -->
    <div v-if="files.length" class="flex flex-col gap-2 mt-3">
      <div v-for="(file, idx) in files" :key="`${file.name}-${idx}`" class="flex items-center gap-3 p-2 border border-surface-200 rounded-lg bg-surface-50">
        <img
          v-if="isImage(file.type)"
          :src="file.url"
          :alt="file.name"
          class="w-10 h-10 object-cover rounded-md"
        />
        <span v-else class="text-2xl">📄</span>
        <div class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-surface-900 truncate">{{ file.name }}</span>
          <span class="text-xs text-surface-500">{{ formatSize(file.size) }}</span>
        </div>
        <Button
          v-if="!disabled && !readOnly"
          severity="danger"
          text
          class="px-3"
          @click="removeFile(idx)"
        >✕</Button>
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
.has-error .fileUpload { border: 1.5px solid var(--color-error, #ef4444); }
.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
