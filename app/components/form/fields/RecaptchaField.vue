<script setup lang="ts">
/**
 * reCAPTCHA Component
 * Placeholder for Google reCAPTCHA integration.
 * In production, this would load the reCAPTCHA script and verify tokens.
 * Currently provides a visual placeholder and dev-mode bypass.
 */
import { ref, computed, onMounted } from 'vue'
import type { FormComponentSchema, ValidationError } from '../../types/form'

const props = defineProps<{
  component: FormComponentSchema
  modelValue: unknown
  errors: ValidationError[]
  disabled: boolean
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown> | null]
  'blur': [key: string]
}>()

const isVerified = ref(false)
const isVerifying = ref(false)

const hasErrors = computed(() => props.errors.length > 0)

const siteKey = computed(() => {
  return (props.component as Record<string, unknown>).siteKey as string || ''
})

function simulateVerification() {
  if (isVerified.value || isVerifying.value || props.disabled) return

  isVerifying.value = true

  // Simulated verification for demo/dev purposes
  setTimeout(() => {
    isVerified.value = true
    isVerifying.value = false
    emit('update:modelValue', {
      success: true,
      token: `demo-token-${Date.now()}`,
      timestamp: new Date().toISOString(),
    })
  }, 1500)
}
</script>

<template>
  <div class="form-field recaptcha-field" :class="{ 'has-error': hasErrors, 'is-disabled': disabled }">
    <div class="recaptcha-widget" :class="{ 'is-verified': isVerified, 'is-verifying': isVerifying }">
      <div class="recaptcha-content">
        <!-- Checkbox area -->
        <button
          type="button"
          class="recaptcha-checkbox"
          :class="{ 'is-checked': isVerified, 'is-loading': isVerifying }"
          :disabled="disabled || isVerified"
          @click="simulateVerification"
        >
          <template v-if="isVerifying">
            <span class="recaptcha-spinner" />
          </template>
          <template v-else-if="isVerified">
            <span class="recaptcha-check">✓</span>
          </template>
        </button>

        <span class="recaptcha-label">
          {{ isVerified ? 'Verified' : isVerifying ? 'Verifying...' : "I'm not a robot" }}
        </span>
      </div>

      <!-- reCAPTCHA branding -->
      <div class="recaptcha-branding">
        <div class="recaptcha-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#4285F4" opacity="0.2"/>
            <path d="M12 2l10 5v10l-10 5-10-5V7l10-5z" stroke="#4285F4" stroke-width="1" fill="none"/>
            <text x="8" y="16" font-size="10" fill="#4285F4" font-weight="bold">R</text>
          </svg>
        </div>
        <div class="recaptcha-branding-text">
          <span class="recaptcha-branding-title">reCAPTCHA</span>
          <span class="recaptcha-branding-links">Privacy · Terms</span>
        </div>
      </div>
    </div>

    <!-- Dev mode note -->
    <p class="recaptcha-note">
      ⓘ Demo mode — verification is simulated.
      <template v-if="siteKey">Site Key: {{ siteKey.substring(0, 8) }}...</template>
    </p>

    <div v-if="hasErrors" class="form-field__errors">
      <p v-for="error in errors" :key="error.type" class="form-field__error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.recaptcha-field {
  margin-bottom: 1.25rem;
}

.recaptcha-widget {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-input-bg, #f9fafb);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  min-width: 18rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.recaptcha-widget.is-verified {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.04);
}

.recaptcha-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recaptcha-checkbox {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 0.25rem;
  background: var(--color-input-bg, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.recaptcha-checkbox:hover:not(:disabled) {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.recaptcha-checkbox.is-checked {
  background: #22c55e;
  border-color: #22c55e;
}

.recaptcha-checkbox.is-loading {
  border-color: var(--color-primary, #6366f1);
}

.recaptcha-checkbox:disabled {
  cursor: default;
}

.recaptcha-check {
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
}

.recaptcha-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid var(--color-border, #d1d5db);
  border-top-color: var(--color-primary, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.recaptcha-label {
  font-size: 0.8125rem;
  color: var(--color-text, #374151);
  user-select: none;
}

.recaptcha-branding {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.recaptcha-logo {
  opacity: 0.6;
}

.recaptcha-branding-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.recaptcha-branding-title {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-placeholder, #9ca3af);
}

.recaptcha-branding-links {
  font-size: 0.5625rem;
  color: var(--color-placeholder, #9ca3af);
}

.recaptcha-note {
  font-size: 0.6875rem;
  color: var(--color-description, #9ca3af);
  margin: 0.375rem 0 0 0;
  font-style: italic;
}

.form-field__errors { margin-top: 0.375rem; }
.form-field__error { font-size: 0.75rem; color: var(--color-error, #ef4444); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
.form-field__error::before { content: '⚠'; font-size: 0.625rem; }
</style>
