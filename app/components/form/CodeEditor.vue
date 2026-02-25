<template>
  <div class="code-editor-wrapper" :class="{ 'is-disabled': disabled }">
    <div v-if="label" class="code-editor-header">
      <label class="code-editor-label">{{ label }}</label>
      <span v-if="tooltip" class="code-editor-tooltip" v-tooltip="tooltip">
        <i class="pi pi-question-circle text-xs text-slate-400 cursor-help"></i>
      </span>
    </div>
    
    <div class="code-editor-container" :style="{ height: computedHeight }">
      <Codemirror
        v-model="internalValue"
        :placeholder="placeholder"
        :style="{ height: '100%', width: '100%' }"
        :autofocus="false"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        :disabled="disabled"
        @change="handleChange"
      />
    </div>
    <div v-if="description" class="code-editor-description">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const props = defineProps<{
  modelValue: string | null | undefined
  mode?: 'javascript' | 'css' | 'json'
  label?: string
  description?: string
  tooltip?: string
  placeholder?: string
  height?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const internalValue = ref(props.modelValue || '')

watch(() => props.modelValue, (newVal) => {
  if (newVal !== internalValue.value) {
    internalValue.value = newVal || ''
  }
})

function handleChange(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}

const computedHeight = computed(() => {
  return props.height || '150px'
})

// Configure Codemirror Extensions
const extensions = computed(() => {
  const exts = [oneDark]
  
  // Custom font size for cleaner look in the builder
  exts.push(EditorView.theme({
    "&": {
      fontSize: "12px"
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace"
    }
  }))

  if (props.mode === 'javascript') {
    exts.push(javascript())
  } else if (props.mode === 'css') {
    exts.push(css())
  } else if (props.mode === 'json') {
    exts.push(json())
  }

  // If disabled, add readOnly extension
  if (props.disabled) {
    exts.push(EditorView.editable.of(false))
  }

  return exts
})
</script>

<style scoped>
.code-editor-wrapper {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  box-sizing: border-box;
}

.code-editor-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.375rem;
  gap: 0.5rem;
}

.code-editor-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--builder-text, #1e293b);
}

.code-editor-container {
  border: 1px solid var(--builder-border, #e2e8f0);
  border-radius: 0.375rem;
  overflow: hidden;
  position: relative;
  background-color: #282c34; /* oneDark background */
}

/* Ensure codemirror takes full space */
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-scroller) {
  font-family: inherit;
}

.code-editor-description {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--builder-text-muted, #64748b);
}

.is-disabled .code-editor-container {
  opacity: 0.7;
  cursor: not-allowed;
}
.is-disabled :deep(.cm-content) {
  cursor: not-allowed;
}
</style>
