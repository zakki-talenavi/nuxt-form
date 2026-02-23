/**
 * ========================================
 * Component Registry Composable
 * ========================================
 * Dynamic, extensible registry for form field components.
 * Maps component type strings to Vue component implementations.
 * Supports runtime registration and type-safe lookups.
 *
 * Replaces the static `Components._components` pattern from formio.js
 * with a reactive, SSR-safe approach.
 */

import { shallowRef, markRaw, type Component as VueComponent } from 'vue'
import type { BuilderComponentInfo, FormComponentSchema } from '../types/form'

interface RegisteredComponent {
  component: VueComponent
  builderInfo: BuilderComponentInfo
  defaultSchema: Partial<FormComponentSchema>
}

// ─── Shared global registry (singleton per app) ────────────────
const registry = shallowRef<Map<string, RegisteredComponent>>(new Map())

/**
 * useComponentRegistry
 *
 * Provides methods to register, unregister, and resolve
 * form field components dynamically.
 */
export function useComponentRegistry() {
  /**
   * Register a component in the registry.
   */
  function register(
    type: string,
    component: VueComponent,
    builderInfo: BuilderComponentInfo,
    defaultSchema: Partial<FormComponentSchema> = {},
  ): void {
    const newMap = new Map(registry.value)
    newMap.set(type, {
      component: markRaw(component),
      builderInfo,
      defaultSchema: {
        type,
        key: type,
        input: true,
        ...defaultSchema,
      },
    })
    registry.value = newMap
  }

  /**
   * Unregister a component from the registry.
   */
  function unregister(type: string): boolean {
    const newMap = new Map(registry.value)
    const deleted = newMap.delete(type)
    registry.value = newMap
    return deleted
  }

  /**
   * Resolve a component by type name.
   * Returns undefined if not found.
   */
  function resolve(type: string): RegisteredComponent | undefined {
    return registry.value.get(type)
  }

  /**
   * Get the Vue component for a given type.
   */
  function getComponent(type: string): VueComponent | undefined {
    return registry.value.get(type)?.component
  }

  /**
   * Check if a component type is registered.
   */
  function has(type: string): boolean {
    return registry.value.has(type)
  }

  /**
   * Get all registered component types.
   */
  function getTypes(): string[] {
    return Array.from(registry.value.keys())
  }

  /**
   * Get all registered components with their builder info.
   * Useful for the form builder sidebar.
   */
  function getBuilderComponents(): BuilderComponentInfo[] {
    const infos: BuilderComponentInfo[] = []
    for (const [, entry] of registry.value) {
      infos.push(entry.builderInfo)
    }
    return infos.sort((a, b) => a.weight - b.weight)
  }

  /**
   * Get builder components grouped by their group property.
   */
  function getBuilderGroups(): Record<string, BuilderComponentInfo[]> {
    const groups: Record<string, BuilderComponentInfo[]> = {}

    for (const [, entry] of registry.value) {
      const group = entry.builderInfo.group
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(entry.builderInfo)
    }

    // Sort each group by weight
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.weight - b.weight)
    }

    return groups
  }

  /**
   * Create a default schema for a component type.
   */
  function createDefaultSchema(type: string): FormComponentSchema | undefined {
    const entry = registry.value.get(type)
    if (!entry) return undefined

    return {
      type,
      key: type,
      label: entry.builderInfo.title,
      input: true,
      ...entry.builderInfo.schema,
      ...entry.defaultSchema,
    } as FormComponentSchema
  }

  /**
   * Get the count of registered components.
   */
  function size(): number {
    return registry.value.size
  }

  return {
    register,
    unregister,
    resolve,
    getComponent,
    has,
    getTypes,
    getBuilderComponents,
    getBuilderGroups,
    createDefaultSchema,
    size,
    registry,
  }
}
