<script setup lang="ts">
/**
 * ColumnsField Component
 * Multi-column layout via CSS Flexbox. Each column has its own components[].
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface ColumnDef {
  components: FormComponentSchema[]
  width?: number
  offset?: number
  push?: number
  pull?: number
  size?: string
  currentWidth?: number
}

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

defineEmits<{
  'update:modelValue': [value: unknown]
  'blur': [key: string]
}>()

const columns = computed<ColumnDef[]>(() => {
  return (props.component.columns as ColumnDef[]) || []
})

const totalWidth = computed(() => {
  return columns.value.reduce((sum, col) => sum + (col.width || col.currentWidth || 6), 0) || 12
})

function getColumnStyle(col: ColumnDef): Record<string, string> {
  const w = col.width || col.currentWidth || 6
  const pct = (w / totalWidth.value) * 100
  return { flex: `0 0 ${pct}%`, maxWidth: `${pct}%` }
}
</script>

<template>
  <div class="columns-field">
    <div class="columns-field__row">
      <div
        v-for="(col, colIdx) in columns"
        :key="colIdx"
        class="columns-field__col"
        :style="getColumnStyle(col)"
      >
        <slot name="renderZone" :list="col.components">
          <template v-for="(child, childIdx) in col.components" :key="child.key || childIdx">
            <slot name="renderComponent" :component="child" />
          </template>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.columns-field { margin-bottom: 1.25rem; overflow-x: hidden; }
.columns-field__row { display: flex; flex-wrap: wrap; margin: -0.5rem; }
.columns-field__col { padding: 0.5rem; min-width: 0; box-sizing: border-box; }

@media (max-width: 640px) {
  .columns-field__row { flex-direction: column; }
  .columns-field__col { flex: 0 0 100% !important; max-width: 100% !important; }
}
</style>
