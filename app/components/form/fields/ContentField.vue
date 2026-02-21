<script setup lang="ts">
/**
 * ContentField Component
 * Renders static HTML content or a rich-text WYSIWYG editor using Tiptap.
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

// Default Content block (static HTML) typically isn't an input.
// However, Form.io allows custom WYSIWYG components.
const isInput = computed(() => {
  // If property explicitly says input: true OR if it's bound to a custom wysiwyg field
  return props.component.input === true || props.component.editor === 'quill' || props.component.editor === 'wysiwyg'
})

const htmlContent = computed(() => (props.component.html as string) || (props.modelValue as string) || '')
const hasErrors = computed(() => props.errors.length > 0)

// --- Tiptap Logic ---
const editor = useEditor({
  content: props.modelValue as string || props.component.html as string || '',
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
  <div class="form-field content-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <label v-if="component.label && isInput" class="form-field__label">
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>
    
    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <!-- Editor Mode -->
    <div v-if="isInput" class="tiptap-wrapper" :class="{ 'is-focused': editor?.isFocused }">
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
        <Button 
          type="button" 
          v-tooltip.top="'Strikethrough'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('strike') }" 
          text size="small" 
          @click="editor.chain().focus().toggleStrike().run()"
        ><span class="line-through">S</span></Button>
        
        <Divider layout="vertical" class="mx-1" />
        
        <Button 
          type="button" 
          v-tooltip.top="'Heading 1'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('heading', { level: 1 }) }" 
          text size="small" 
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        ><span class="font-bold">H1</span></Button>
        <Button 
          type="button" 
          v-tooltip.top="'Heading 2'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('heading', { level: 2 }) }" 
          text size="small" 
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        ><span class="font-bold">H2</span></Button>
        
        <Divider layout="vertical" class="mx-1" />

        <Button 
          type="button" 
          v-tooltip.top="'Bullet List'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('bulletList') }" 
          text size="small" 
          @click="editor.chain().focus().toggleBulletList().run()"
        ><span>• List</span></Button>
        <Button 
          type="button" 
          v-tooltip.top="'Ordered List'" 
          :class="{ 'border-primary-500 text-primary-600 bg-primary-50': editor.isActive('orderedList') }" 
          text size="small" 
          @click="editor.chain().focus().toggleOrderedList().run()"
        ><span>1. List</span></Button>
      </div>
      
      <EditorContent :editor="editor" class="tiptap-content p-3" />
    </div>

    <!-- Static Render Mode -->
    <div
      v-else
      class="static-content"
      :class="[component.customClass]"
      v-html="htmlContent"
    />

    <div v-if="hasErrors && isInput" class="form-field__errors mt-1">
      <p v-for="error in errors" :key="error.type" class="form-field__error text-xs text-red-500 m-0">
        ⚠ {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.content-field { margin-bottom: 1.25rem; }

.form-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.5rem; }
.form-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
.form-field__description { font-size: 0.75rem; color: var(--color-description, #6b7280); margin: 0 0 0.5rem 0; }

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

/* Tiptap content styling */
.tiptap-content :deep(.ProseMirror) {
  min-height: 120px;
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

.tiptap-content :deep(h1), .static-content :deep(h1) { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
.tiptap-content :deep(h2), .static-content :deep(h2) { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
.tiptap-content :deep(ul), .static-content :deep(ul) { padding-left: 1.5rem; list-style-type: disc; margin-bottom: 0.5rem; }
.tiptap-content :deep(ol), .static-content :deep(ol) { padding-left: 1.5rem; list-style-type: decimal; margin-bottom: 0.5rem; }
.tiptap-content :deep(p), .static-content :deep(p) { margin-bottom: 0.5rem; margin-top: 0; }
.tiptap-content :deep(blockquote) { border-left: 3px solid #e5e7eb; padding-left: 1rem; color: #6b7280; font-style: italic; }

.static-content {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text, #111827);
}
</style>
