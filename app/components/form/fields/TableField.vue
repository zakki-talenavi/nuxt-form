<script setup lang="ts">
/**
 * TableField Component
 * HTML table layout with components in each cell.
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

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

interface TableCell {
  components: FormComponentSchema[]
}

const rows = computed<TableCell[][]>(() => {
  return (props.component.rows as TableCell[][]) || []
})

const numCols = computed(() => (props.component.numCols as number) || (rows.value[0]?.length ?? 0))
const headers = computed(() => (props.component.header as string[]) || [])
</script>

<template>
  <div class="table-field" :class="[component.customClass]">
    <label v-if="component.label" class="table-field__label">{{ component.label }}</label>
    <div class="table-field__wrapper">
      <table class="table-field__table">
        <thead v-if="headers.length">
          <tr>
            <th v-for="(h, i) in headers" :key="i" class="table-field__th">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIdx) in rows" :key="rowIdx">
            <td v-for="(cell, cellIdx) in row" :key="cellIdx" class="table-field__td">
              <slot name="renderZone" :list="cell.components">
                <template v-for="(child, childIdx) in cell.components" :key="child.key || childIdx">
                  <slot name="renderComponent" :component="child" />
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-field { margin-bottom: 1.25rem; }
.table-field__label { display: block; font-weight: 600; font-size: 0.875rem; color: var(--color-label, #374151); margin-bottom: 0.5rem; }
.table-field__wrapper { overflow-x: auto; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.5rem; }
.table-field__table { width: 100%; border-collapse: collapse; }
.table-field__th { padding: 0.625rem 0.875rem; text-align: left; font-size: 0.8125rem; font-weight: 600; color: var(--color-label, #374151); background: var(--color-hover, #f9fafb); border-bottom: 1.5px solid var(--color-border, #d1d5db); }
.table-field__td { padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--color-border, #e5e7eb); vertical-align: top; }
.table-field__td:last-child { border-right: none; }
</style>
