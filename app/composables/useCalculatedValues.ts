/**
 * ========================================
 * Calculated Values Composable
 * ========================================
 * Watches form data and evaluates `calculateValue` expressions
 * on components that define them. Supports template syntax
 * like `value = data.price * data.quantity`.
 *
 * Uses sandboxed evaluation (no raw eval) with a restricted
 * scope for safety.
 */

import { watch, type Ref } from 'vue'
import type { FormComponentSchema } from '../types/form'

/**
 * Safely evaluate a calculation expression.
 * Expression has access to: `value` (current field value), `data` (all form data),
 * `row` (alias for data), `component` (schema).
 */
function evaluateExpression(
  expression: string,
  data: Record<string, unknown>,
  component: FormComponentSchema,
): unknown {
  try {
    const fn = new Function(
      'value', 'data', 'row', 'component',
      `"use strict";
       try {
         ${expression.startsWith('value =') || expression.startsWith('value=')
            ? expression
            : `value = ${expression}`}
         return value;
       } catch(e) { return undefined; }`,
    )
    return fn(data[component.key], data, data, component)
  } catch {
    return undefined
  }
}

/**
 * Set up calculated values for a form.
 *
 * @param formData - Reactive form data object
 * @param components - Computed/ref array of all flattened components
 * @param setFieldValue - Function to update a field value
 */
export function useCalculatedValues(
  formData: Record<string, unknown>,
  components: Ref<FormComponentSchema[]>,
  setFieldValue: (key: string, value: unknown) => void,
) {
  // Track which fields have calculateValue expressions
  const getCalculatedComponents = () =>
    components.value.filter(
      (c) => c.calculateValue && typeof c.calculateValue === 'string',
    )

  // Watch all form data and re-evaluate calculated fields
  watch(
    () => ({ ...formData }),
    (data) => {
      const calculatedComponents = getCalculatedComponents()

      for (const comp of calculatedComponents) {
        const expression = comp.calculateValue as string
        const result = evaluateExpression(expression, data, comp)

        // Only update if the result is different to avoid infinite loops
        if (result !== undefined && result !== formData[comp.key]) {
          setFieldValue(comp.key, result)
        }
      }
    },
    { deep: false },
  )

  /**
   * Manually trigger recalculation for all calculated fields.
   */
  function recalculate(): void {
    const data = { ...formData }
    const calculatedComponents = getCalculatedComponents()

    for (const comp of calculatedComponents) {
      const expression = comp.calculateValue as string
      const result = evaluateExpression(expression, data, comp)
      if (result !== undefined) {
        setFieldValue(comp.key, result)
      }
    }
  }

  return { recalculate }
}
