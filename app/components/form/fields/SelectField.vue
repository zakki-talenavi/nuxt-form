<script setup lang="ts">
/**
 * SelectField Component
 * Dropdown select with support for static values,
 * multiple selection, and search.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { FormComponentSchema, ValidationError, SelectValue } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'blur': [key: string]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const selectRef = ref<HTMLDivElement | null>(null)

const selectedValue = computed({
  get: () => {
    if (props.component.multiple) {
      return Array.isArray(props.modelValue) ? props.modelValue as string[] : []
    }
    return (props.modelValue as string) ?? ''
  },
  set: (val: string | string[]) => emit('update:modelValue', val),
})

const options = computed<SelectValue[]>(() => {
  const data = props.component.data
  if (!data) return []
  return data.values ?? []
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return options.value
  const q = searchQuery.value.toLowerCase()
  return options.value.filter(
    (opt) => opt.label.toLowerCase().includes(q) ||
            String(opt.value).toLowerCase().includes(q),
  )
})

const selectedLabel = computed(() => {
  if (props.component.multiple) {
    const vals = Array.isArray(selectedValue.value) ? selectedValue.value : []
    return vals
      .map((v) => options.value.find((o) => String(o.value) === String(v))?.label ?? v)
      .join(', ')
  }
  const opt = options.value.find((o) => String(o.value) === String(selectedValue.value))
  return opt?.label ?? ''
})

const hasErrors = computed(() => props.errors.length > 0)

function toggleDropdown() {
  if (props.disabled || props.readOnly) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

function selectOption(opt: SelectValue) {
  if (props.component.multiple) {
    const currentArr = Array.isArray(selectedValue.value) ? [...selectedValue.value] : []
    const strVal = String(opt.value)
    const idx = currentArr.indexOf(strVal)
    if (idx > -1) {
      currentArr.splice(idx, 1)
    } else {
      currentArr.push(strVal)
    }
    emit('update:modelValue', currentArr)
  } else {
    emit('update:modelValue', String(opt.value))
    isOpen.value = false
  }
}

function isSelected(opt: SelectValue): boolean {
  if (props.component.multiple) {
    const arr = Array.isArray(selectedValue.value) ? selectedValue.value : []
    return arr.includes(String(opt.value))
  }
  return String(selectedValue.value) === String(opt.value)
}

function clearSelection() {
  if (props.component.multiple) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', '')
  }
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
    emit('blur', props.component.key)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="selectRef"
    class="form-field"
    :class="{ 'has-error': hasErrors, 'is-disabled': disabled }"
  >
    <label
      v-if="component.label"
      :for="`field-${component.key}`"
      class="form-field__label"
    >
      {{ component.label }}
      <span v-if="component.validate?.required" class="form-field__required">*</span>
    </label>

    <p v-if="component.description" class="form-field__description">
      {{ component.description }}
    </p>

    <div
      :id="`field-${component.key}`"
      class="select-wrapper"
      :class="{ 'is-open': isOpen, 'is-disabled': disabled || readOnly }"
      @click="toggleDropdown"
    >
      <div class="select-display">
        <span v-if="selectedLabel" class="select-value">{{ selectedLabel }}</span>
        <span v-else class="select-placeholder">
          {{ component.placeholder || 'Select an option...' }}
        </span>
        <div class="select-actions">
          <button
            v-if="selectedLabel && !disabled && !readOnly"
            class="select-clear"
            type="button"
            @click.stop="clearSelection"
          >
            ✕
          </button>
          <span class="select-chevron" :class="{ 'is-open': isOpen }">
            ▾
          </span>
        </div>
      </div>

      <Transition name="dropdown">
        <div v-if="isOpen" class="select-dropdown" @click.stop>
          <div v-if="options.length > 5" class="select-search">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="select-search__input"
              @click.stop
            />
          </div>

          <ul class="select-options">
            <li
              v-for="opt in filteredOptions"
              :key="String(opt.value)"
              class="select-option"
              :class="{ 'is-selected': isSelected(opt) }"
              @click.stop="selectOption(opt)"
            >
              <span v-if="component.multiple" class="select-check">
                {{ isSelected(opt) ? '☑' : '☐' }}
              </span>
              {{ opt.label }}
            </li>
            <li v-if="filteredOptions.length === 0" class="select-option select-option--empty">
              No options found
            </li>
          </ul>
        </div>
      </Transition>
    </div>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-field__label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-label, #374151);
  margin-bottom: 0.375rem;
  letter-spacing: -0.01em;
}

.form-field__required {
  color: var(--color-error, #ef4444);
  margin-left: 2px;
}

.form-field__description {
  font-size: 0.75rem;
  color: var(--color-description, #6b7280);
  margin: 0 0 0.375rem 0;
}

.select-wrapper {
  position: relative;
  cursor: pointer;
}

.select-wrapper.is-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-input-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  min-height: 2.625rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.is-open .select-display {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.has-error .select-display {
  border-color: var(--color-error, #ef4444);
}

.select-value {
  flex: 1;
  color: var(--color-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-placeholder {
  flex: 1;
  color: var(--color-placeholder, #9ca3af);
}

.select-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.select-clear {
  background: none;
  border: none;
  color: var(--color-placeholder, #9ca3af);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}

.select-clear:hover {
  color: var(--color-error, #ef4444);
}

.select-chevron {
  font-size: 0.75rem;
  color: var(--color-placeholder, #9ca3af);
  transition: transform 0.2s ease;
}

.select-chevron.is-open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-input-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
              0 4px 10px rgba(0, 0, 0, 0.05);
  z-index: 50;
  max-height: 240px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.select-search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.select-search__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  outline: none;
  box-sizing: border-box;
}

.select-search__input:focus {
  border-color: var(--color-primary, #6366f1);
}

.select-options {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
  max-height: 200px;
}

.select-option {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.15s ease;
}

.select-option:hover {
  background: var(--color-hover, #f3f4f6);
}

.select-option.is-selected {
  background: rgba(99, 102, 241, 0.08);
  color: var(--color-primary, #6366f1);
  font-weight: 500;
}

.select-option--empty {
  color: var(--color-placeholder, #9ca3af);
  cursor: default;
  font-style: italic;
}

.select-check {
  font-size: 0.875rem;
}

.form-field__errors {
  margin-top: 0.375rem;
}

.form-field__error {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-field__error::before {
  content: '⚠';
  font-size: 0.625rem;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
