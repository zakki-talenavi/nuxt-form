<script setup lang="ts">
/**
 * HtmlElementField Component
 * Renders a raw HTML element with configurable tag, attrs, and content.
 * If set as an input (using WYSIWYG), it provides a rich-text editor editing the content.
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
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

const isInput = computed(() => {
  return props.component.input === true || props.component.editor === 'quill' || props.component.editor === 'wysiwyg'
})

const tag = computed(() => (props.component.tag as string) || 'div')
// If input, we prioritize modelValue, else fallback to content
const rawContent = computed(() => {
  if (isInput.value && props.modelValue !== undefined) {
    return props.modelValue as string
  }
  return (props.component.content as string) || ''
})
const hasErrors = computed(() => props.errors.length > 0)

const className = computed(() => (props.component.className as string) || '')
const attrs = computed(() => (props.component.attrs as Array<{ attr: string; value: string }>) || [])

const computedAttrs = computed(() => {
  const result: Record<string, string> = {}
  if (className.value && !isInput.value) result.class = className.value
  for (const a of attrs.value) {
    result[a.attr] = a.value
  }
  return result
})

// --- Tiptap Logic ---
const editor = useEditor({
  content: rawContent.value,
  extensions: [
    StarterKit,
  ],
  editable: !props.disabled && !props.readOnly,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  onBlur: () => {
    emit('blur', props.component.key)
  }
})

watch(() => props.modelValue, (val) => {
  const isSame = editor.value?.getHTML() === val
  if (!isSame && typeof val === 'string') {
    editor.value?.commands.setContent(val, false)
  }
})

watch(() => [props.disabled, props.readOnly], ([d, r]) => {
  editor.value?.setEditable(!d && !r)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="form-field html-element-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <!-- Static Render Mode -->
    <component
      v-if="!isInput"
      :is="tag"
      v-bind="computedAttrs"
      class="html-element-static"
      v-html="rawContent"
    />

    <!-- Editor Mode -->
    <div v-else class="tiptap-wrapper" :class="{ 'is-focused': editor?.isFocused }">
      <div v-if="editor && !disabled && !readOnly" class="tiptap-menu flex gap-1 p-2 border-b bg-surface-50 border-surface-200">
        <Button 
          type="button" 
          v-tooltip.top="'Bold'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('bold') }" 
          text size="small" 
          @click="editor.chain().focus().toggleBold().run()"
        ><span class="font-bold">B</span></Button>
        <Button 
          type="button" 
          v-tooltip.top="'Italic'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('italic') }" 
          text size="small" 
          @click="editor.chain().focus().toggleItalic().run()"
        ><span class="italic">I</span></Button>
      </div>
      
      <EditorContent :editor="editor" class="tiptap-content p-3" />
      
      <div v-if="hasErrors" class="form-field__errors mt-1 px-3 pb-3">
        <p v-for="error in errors" :key="error.type" class="form-field__error text-xs text-red-500 m-0">
          ⚠ {{ error.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.html-element-field { margin-bottom: 1.25rem; }

.tiptap-wrapper {
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-input-bg, #fff);
  transition: border-color 0.2s;
}

.tiptap-wrapper.is-focused {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.has-error .tiptap-wrapper {
  border-color: var(--color-error, #ef4444);
}

.is-disabled .tiptap-wrapper {
  background: var(--color-disabled-bg, #f3f4f6);
  opacity: 0.8;
}

.tiptap-content :deep(.ProseMirror) {
  min-height: 80px;
  outline: none;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text, #111827);
}

.tiptap-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
