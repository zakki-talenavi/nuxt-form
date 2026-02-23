<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const CodeEditor = defineAsyncComponent(() => import('../../CodeEditor.vue'))

const props = defineProps<{
  component: any
}>()

const emit = defineEmits<{
  update: [prop: string, value: any]
}>()

function updateProp(prop: string, value: any) {
  emit('update', prop, value)
}

function updateValidation(prop: string, value: any) {
  const comp = props.component
  updateProp('validate', { ...comp.validate, [prop]: value })
}
</script>

<template>
  <div>
    <div class="prop-field flex items-center gap-2 mt-2">
      <Checkbox
        :model-value="component.validate?.required ?? false"
        binary
        inputId="propRequired"
        @update:model-value="updateValidation('required', $event)"
      />
      <label for="propRequired" class="prop-label mb-0 cursor-pointer">Required</label>
    </div>
    
    <div class="prop-field flex items-center gap-2 mt-2">
      <Checkbox
        :model-value="component.unique ?? false"
        binary
        inputId="propUnique"
        @update:model-value="updateProp('unique', $event)"
      />
      <label for="propUnique" class="prop-label mb-0 cursor-pointer">Unique</label>
    </div>
    
    <div class="flex-row mt-4" v-if="['textfield', 'textarea', 'password'].includes(component.type)">
      <div class="prop-field flex-1">
        <label class="prop-label">Min Length</label>
        <InputText
          :model-value="component.validate?.minLength || ''"
          type="number"
          class="w-full"
          size="small"
          @update:model-value="updateValidation('minLength', $event ? parseInt($event as string) : undefined)"
        />
      </div>
      <div class="prop-field flex-1">
        <label class="prop-label">Max Length</label>
        <InputText
          :model-value="component.validate?.maxLength || ''"
          type="number"
          class="w-full"
          size="small"
          @update:model-value="updateValidation('maxLength', $event ? parseInt($event as string) : undefined)"
        />
      </div>
    </div>
    
    <div class="flex-row mt-4" v-if="['number', 'currency'].includes(component.type)">
      <div class="prop-field flex-1">
        <label class="prop-label">Minimum</label>
        <InputText
          :model-value="component.validate?.min || ''"
          type="number"
          class="w-full"
          size="small"
          @update:model-value="updateValidation('min', $event ? parseFloat($event as string) : undefined)"
        />
      </div>
      <div class="prop-field flex-1">
        <label class="prop-label">Maximum</label>
        <InputText
          :model-value="component.validate?.max || ''"
          type="number"
          class="w-full"
          size="small"
          @update:model-value="updateValidation('max', $event ? parseFloat($event as string) : undefined)"
        />
      </div>
    </div>
    
    <!-- Regular Expression Validation -->
    <div class="prop-field mt-3" v-if="['textfield', 'textarea', 'password'].includes(component.type)">
      <label class="prop-label">Regular Expression Pattern</label>
      <InputText
        :model-value="component.validate?.pattern || ''"
        class="w-full font-mono text-xs"
        size="small"
        placeholder="e.g. ^[a-zA-Z0-9]+$"
        @update:model-value="updateValidation('pattern', $event)"
      />
    </div>
    
    <div class="prop-field">
      <label class="prop-label">Custom Error Message</label>
      <InputText
        :model-value="component.validate?.customMessage || ''"
        class="w-full"
        size="small"
        placeholder="Message to display when validation fails"
        @update:model-value="updateValidation('customMessage', $event)"
      />
    </div>
    
    <div class="prop-field mt-3">
      <CodeEditor
        :model-value="component.validate?.custom"
        mode="javascript"
        label="Custom Validation"
        tooltip="Use JavaScript to validate this component's value. Return 'true' if valid, or a string error message if invalid."
        placeholder="if (input !== 'valid') { return 'Invalid input'; } else { return true; }"
        height="120px"
        @change="updateValidation('custom', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.prop-field {
  margin-bottom: 0.875rem;
}

.prop-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-label, #374151);
  margin-bottom: 0.375rem;
}

.flex-row {
  display: flex;
  gap: 0.5rem;
}
</style>
