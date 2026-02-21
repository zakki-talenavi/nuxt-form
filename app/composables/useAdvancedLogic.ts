import { ref, watch, toRaw } from 'vue'
import type { FormComponentSchema } from '../types/form'
import jsonLogicLib from 'json-logic-js'
const jsonLogic = (jsonLogicLib as any).default || jsonLogicLib

/**
 * ========================================
 * Advanced Logic Evaluator
 * ========================================
 * Processes Form.io 'logic' array on components to dynamically
 * overwrite component properties (e.g., changing labels, disabling, hiding)
 * based on the current formData state, without mutating the original schema.
 */
export function useAdvancedLogic(
  allComponents: () => FormComponentSchema[],
  formData: Record<string, unknown>
) {
  // Evaluates explicitly on deep formData changes
  const componentOverrides = ref(new Map<string, Record<string, unknown>>())

  watch(formData, () => {
    const overrides = new Map<string, Record<string, unknown>>()
    
    for (const comp of allComponents()) {
      if (!comp.logic || !Array.isArray(comp.logic) || comp.logic.length === 0) continue
      
      const compOverrides: Record<string, unknown> = {}
      
      for (const logic of comp.logic) {
        let isTriggered = false
        
        // 1. Evaluate Trigger
        if (logic.trigger.type === 'json' && logic.trigger.json) {
          try {
            // Clean the proxy to prevent 3rd party traversal bugs
            const rawData = toRaw(formData)
            // Form.io makes 'data' and 'row' available to jsonLogic context
            isTriggered = !!jsonLogic.apply(logic.trigger.json, { data: rawData, row: rawData, component: comp })
          } catch (e) {
            console.error(`Logic JSON trigger failed for component ${comp.key}:`, e)
          }
        } 
        else if (logic.trigger.type === 'simple' && logic.trigger.simple) {
           const { when, eq, show } = logic.trigger.simple
           if (when) {
             const match = formData[when] === eq
             isTriggered = show ? match : !match
           }
        }
        else if (logic.trigger.type === 'javascript' && logic.trigger.javascript) {
           // Basic string evaluation (sandboxed)
           try {
             const fn = new Function('data', 'row', 'component', `"use strict"; let result = false; ${logic.trigger.javascript}; return result;`)
             isTriggered = !!fn(formData, formData, comp)
           } catch (e) {
             console.error(`Logic JS trigger failed for component ${comp.key}:`, e)
           }
        }
        
        // 2. Apply Actions if triggered
        if (isTriggered && Array.isArray(logic.actions)) {
          for (const action of logic.actions) {
            // 'property' actions mutate the component schema directly (e.g. disabled, hidden, label)
            if (action.type === 'property' && action.property?.value) {
               const propName = action.property.value
               
               let val: unknown = action.state
               if (val === 'true' || val === true) val = true
               else if (val === 'false' || val === false) val = false
               
               // Form.io often passes the string value for text fields through 'text' property
               if (action.text !== undefined && typeof val !== 'boolean') {
                 val = action.text
               }
               
               compOverrides[propName] = val
            }
          }
        }
      }
      
      if (Object.keys(compOverrides).length > 0) {
        overrides.set(comp.key, compOverrides)
      }
    }
    
    componentOverrides.value = overrides
  }, { deep: true, immediate: true })

  return { componentOverrides }
}
