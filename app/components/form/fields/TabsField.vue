<script setup lang="ts">
/**
 * TabsField Component
 * Tabbed interface — each tab has its own components[].
 */
import type { FormComponentSchema, ValidationError } from '../../types/form'

interface TabDef {
  label: string
  key: string
  components: FormComponentSchema[]
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

const tabs = computed<TabDef[]>(() => {
  return (props.component.components as TabDef[]) || []
})

const activeTab = ref(0)

function setActiveTab(index: number) {
  activeTab.value = index
}
</script>

<template>
  <Tabs v-model:value="activeTab" :class="[component.customClass, 'mb-5']">
    <TabList>
      <Tab v-for="(tab, idx) in tabs" :key="`tab-${idx}`" :value="idx">
        {{ tab.label }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel v-for="(tab, idx) in tabs" :key="`panel-${idx}`" :value="idx">
        <template v-for="(child, childIdx) in tab.components" :key="child.key || childIdx">
          <slot name="renderComponent" :component="child" />
        </template>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
</style>
