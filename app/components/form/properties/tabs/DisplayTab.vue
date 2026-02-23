<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

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
</script>

<template>
  <div>
    <!-- Button Specific -->
    <template v-if="component.type === 'button'">
      <div class="prop-field">
        <label class="prop-label">Action</label>
        <Select
          :model-value="component.action || 'submit'"
          :options="[
            { label: 'Submit', value: 'submit' },
            { label: 'Event', value: 'event' },
            { label: 'Custom', value: 'custom' },
            { label: 'Reset', value: 'reset' },
            { label: 'OAuth', value: 'oauth' },
            { label: 'POST to URL', value: 'url' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          size="small"
          @update:model-value="updateProp('action', $event)"
        />
      </div>
      <div class="prop-field flex items-center gap-2 mt-2">
        <Checkbox
          :model-value="component.saveOnEnter ?? false"
          binary
          inputId="saveOnEnter"
          @update:model-value="updateProp('saveOnEnter', $event)"
        />
        <label for="saveOnEnter" class="prop-label mb-0 cursor-pointer">Save On Enter</label>
      </div>
      <div class="prop-field mt-3">
        <label class="prop-label">Theme</label>
        <Select
          :model-value="component.theme || 'primary'"
          :options="[
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Danger', value: 'danger' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          size="small"
          @update:model-value="updateProp('theme', $event)"
        />
      </div>
      <div class="prop-field">
        <label class="prop-label">Size</label>
        <Select
          :model-value="component.size || 'md'"
          :options="[
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          size="small"
          @update:model-value="updateProp('size', $event)"
        />
      </div>
      <div class="prop-field flex items-center gap-2 mt-2">
        <Checkbox
          :model-value="component.block ?? false"
          binary
          inputId="blockBtn"
          @update:model-value="updateProp('block', $event)"
        />
        <label for="blockBtn" class="prop-label mb-0 cursor-pointer">Block Button</label>
      </div>
      <div class="prop-field mt-3">
        <label class="prop-label">Left Icon</label>
        <InputText
          :model-value="component.leftIcon"
          placeholder="e.g. pi pi-check"
          class="w-full"
          size="small"
          @update:model-value="updateProp('leftIcon', $event)"
        />
      </div>
      <div class="prop-field">
        <label class="prop-label">Right Icon</label>
        <InputText
          :model-value="component.rightIcon"
          placeholder="e.g. pi pi-arrow-right"
          class="w-full"
          size="small"
          @update:model-value="updateProp('rightIcon', $event)"
        />
      </div>
      <div class="prop-field">
        <label class="prop-label">Shortcut</label>
        <InputText
          :model-value="component.shortcut"
          class="w-full"
          size="small"
          placeholder="e.g. Enter"
          @update:model-value="updateProp('shortcut', $event)"
        />
      </div>
      <div class="prop-field flex items-center gap-2 mt-3">
        <Checkbox
          :model-value="component.disableOnInvalid ?? false"
          binary
          inputId="disableOnInvalid"
          @update:model-value="updateProp('disableOnInvalid', $event)"
        />
        <label for="disableOnInvalid" class="prop-label mb-0 cursor-pointer">Disable on Form Invalid</label>
      </div>
    </template>
    <!-- End Button Specific -->

    <div class="prop-field" v-if="component.type !== 'button'">
      <label class="prop-label">Label Position</label>
      <Select
        :model-value="component.labelPosition || 'top'"
        :options="[
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
          { label: 'Left (Left-aligned)', value: 'left-left' },
          { label: 'Left (Right-aligned)', value: 'left-right' },
          { label: 'Right (Left-aligned)', value: 'right-left' },
          { label: 'Right (Right-aligned)', value: 'right-right' }
        ]"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        size="small"
        @update:model-value="updateProp('labelPosition', $event)"
      />
    </div>
    
    <div class="prop-field" v-if="!['button', 'checkbox'].includes(component.type)">
      <label class="prop-label">Placeholder</label>
      <InputText
        :model-value="component.placeholder"
        class="w-full"
        size="small"
        @update:model-value="updateProp('placeholder', $event)"
      />
    </div>
    
    <div class="prop-field">
      <label class="prop-label">Description</label>
      <InputText
        :model-value="component.description"
        class="w-full"
        size="small"
        @update:model-value="updateProp('description', $event)"
      />
    </div>
    
    <div class="prop-field">
      <label class="prop-label">Tooltip</label>
      <InputText
        :model-value="component.tooltip"
        class="w-full"
        size="small"
        @update:model-value="updateProp('tooltip', $event)"
      />
    </div>
    
    <div class="flex-row" v-if="!['button', 'checkbox'].includes(component.type)">
      <div class="prop-field flex-1">
        <label class="prop-label">Prefix</label>
        <InputText
          :model-value="component.prefix"
          class="w-full"
          size="small"
          @update:model-value="updateProp('prefix', $event)"
        />
      </div>
      <div class="prop-field flex-1">
        <label class="prop-label">Suffix</label>
        <InputText
          :model-value="component.suffix"
          class="w-full"
          size="small"
          @update:model-value="updateProp('suffix', $event)"
        />
      </div>
    </div>
    
    <div class="prop-field mt-3">
      <CodeEditor
        :model-value="component.customClass"
        mode="css"
        label="Custom CSS Class"
        tooltip="Custom CSS classes to apply to this component"
        placeholder="btn btn-primary custom-field ..."
        height="60px"
        @change="updateProp('customClass', $event)"
      />
    </div>
    
    <div class="prop-field mt-3">
      <label class="prop-label">Tab Index</label>
      <InputText
        :model-value="component.tabindex"
        class="w-full"
        size="small"
        placeholder="0"
        @update:model-value="updateProp('tabindex', $event)"
      />
    </div>
    
    <div class="prop-section mt-4 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <Checkbox
          :model-value="component.hidden ?? false"
          binary
          inputId="propHidden"
          @update:model-value="updateProp('hidden', $event)"
        />
        <label for="propHidden" class="prop-label mb-0 cursor-pointer">Hidden</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          :model-value="component.disabled ?? false"
          binary
          inputId="propDisabled"
          @update:model-value="updateProp('disabled', $event)"
        />
        <label for="propDisabled" class="prop-label mb-0 cursor-pointer">Disabled</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          :model-value="component.autofocus ?? false"
          binary
          inputId="propAutofocus"
          @update:model-value="updateProp('autofocus', $event)"
        />
        <label for="propAutofocus" class="prop-label mb-0 cursor-pointer">Initial Focus</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          :model-value="component.tableView ?? true"
          binary
          inputId="propTableView"
          @update:model-value="updateProp('tableView', $event)"
        />
        <label for="propTableView" class="prop-label mb-0 cursor-pointer">Table View</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          :model-value="component.modalEdit ?? false"
          binary
          inputId="propModalEdit"
          @update:model-value="updateProp('modalEdit', $event)"
        />
        <label for="propModalEdit" class="prop-label mb-0 cursor-pointer">Modal Edit</label>
      </div>
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

.prop-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--builder-border, #e5e7eb);
}

.flex-row {
  display: flex;
  gap: 0.5rem;
}
</style>
