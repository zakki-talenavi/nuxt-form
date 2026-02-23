<script setup lang="ts">
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
    <div class="prop-field">
      <label class="prop-label">Property Name</label>
      <InputText
        :model-value="component.key"
        class="w-full font-mono text-xs"
        size="small"
        @update:model-value="updateProp('key', $event)"
      />
      <small class="text-xs text-slate-500 mt-1 block">
        The name of this field in the API endpoint.
      </small>
    </div>
    <div class="prop-section">
      <h4 class="prop-section__title">Custom Properties</h4>
      <div class="text-xs text-slate-500 italic mt-2">
        This feature will be mapped to `component.properties` object soon.
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

.prop-section__title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-placeholder, #9ca3af);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
