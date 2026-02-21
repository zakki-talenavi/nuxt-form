<script setup lang="ts">
/**
 * Demo Page — showcases Form.io field types:
 * - Standard form renderer (all 29 types)
 * - Wizard mode (multi-step)
 * - Form Builder
 */
import type { FormSchema, FormSubmission } from '../types/form'
import { useFormI18n } from '../composables/useFormI18n'

useSeoMeta({
  title: 'Form.io Re-Architecture',
  description: 'Modern Nuxt 4 + Vue 3 re-architecture of Form.io',
})

const activeTab = ref<'renderer' | 'wizard' | 'builder'>('renderer')
const { currentLanguage, setLanguage, t, availableLanguages } = useFormI18n()

// ─── Standard Form Schema ────────────────────────────────────
const demoSchema = ref<FormSchema>({
  display: 'form',
  components: [
    {
      type: 'content', key: 'header', label: '', input: false,
      html: '<h3 style="margin:0 0 0.25rem">📋 Comprehensive Field Demo</h3><p style="color:#6b7280;margin:0;font-size:0.875rem">All 29 field types rendered from a single JSON schema.</p>',
    },
    {
      type: 'panel', key: 'personalPanel', label: 'Personal Info', title: 'Personal Information',
      input: false, collapsible: true, theme: 'default',
      components: [
        { type: 'textfield', key: 'fullName', label: 'Full Name', placeholder: 'John Doe', input: true, validate: { required: true, minLength: 2, maxLength: 100 } },
        { type: 'email', key: 'email', label: 'Email Address', placeholder: 'john@example.com', input: true, validate: { required: true } },
        { type: 'password', key: 'password', label: 'Password', placeholder: 'Enter a strong password', input: true, validate: { required: true, minLength: 8 } },
        { type: 'phoneNumber', key: 'phone', label: 'Phone Number', inputMask: '(999) 999-9999', input: true },
        { type: 'url', key: 'website', label: 'Website', placeholder: 'https://yoursite.com', input: true },
      ],
    },
    {
      type: 'panel', key: 'numbersPanel', label: 'Numbers', title: 'Numbers & Currency',
      input: false, collapsible: true, theme: 'primary',
      components: [
        { type: 'number', key: 'age', label: 'Age', placeholder: '25', input: true, validate: { required: true, min: 1, max: 150, integer: true } },
        { type: 'currency', key: 'salary', label: 'Expected Salary', input: true, currency: 'USD', decimalLimit: 2 },
        { type: 'number', key: 'experience', label: 'Years of Experience', input: true, validate: { min: 0, max: 50 }, step: 0.5 },
      ],
    },
    {
      type: 'fieldset', key: 'dateFieldset', label: 'Date & Time Fields', legend: 'Date & Time Fields', input: false,
      components: [
        { type: 'datetime', key: 'startDate', label: 'Start Date & Time', input: true, enableDate: true, enableTime: true },
        { type: 'time', key: 'meetingTime', label: 'Preferred Meeting Time', input: true },
        { type: 'day', key: 'birthday', label: 'Date of Birth', input: true },
      ],
    },
    {
      type: 'select', key: 'department', label: 'Department', placeholder: 'Choose your department...', input: true,
      data: { values: [{ label: 'Engineering', value: 'engineering' }, { label: 'Design', value: 'design' }, { label: 'Marketing', value: 'marketing' }, { label: 'Sales', value: 'sales' }, { label: 'HR', value: 'hr' }] },
      validate: { required: true },
    },
    {
      type: 'radio', key: 'level', label: 'Experience Level', input: true, inline: true,
      values: [{ label: 'Junior', value: 'junior' }, { label: 'Mid', value: 'mid' }, { label: 'Senior', value: 'senior' }, { label: 'Lead', value: 'lead' }],
    },
    {
      type: 'selectboxes', key: 'skills', label: 'Skills (pick all that apply)', input: true, inline: true,
      values: [{ label: 'JavaScript', value: 'js' }, { label: 'TypeScript', value: 'ts' }, { label: 'Python', value: 'python' }, { label: 'Go', value: 'go' }, { label: 'Rust', value: 'rust' }],
    },
    { type: 'tags', key: 'interests', label: 'Interests / Tags', placeholder: 'Type and press Enter…', input: true },
    { type: 'textarea', key: 'bio', label: 'Bio', placeholder: 'Tell us about yourself...', input: true, rows: 3, validate: { minWords: 3, maxWords: 200 } },
    {
      type: 'well', key: 'termsWell', label: '', input: false,
      components: [
        { type: 'checkbox', key: 'agreeTerms', label: 'I agree to the Terms of Service and Privacy Policy', input: true, validate: { required: true } },
      ],
    },
    { type: 'file', key: 'resume', label: 'Upload Resume', input: true },
    { type: 'signature', key: 'signature', label: 'Signature', input: true },
    // --- Data components ---
    {
      type: 'panel', key: 'dataComponentsPanel', label: 'Data Components', title: 'Data Components (DataGrid, EditGrid, DataMap)',
      input: false, collapsible: true, theme: 'info',
      components: [
        {
          type: 'datagrid', key: 'teamMembers', label: 'Team Members (Data Grid)', input: true,
          components: [
            { type: 'textfield', key: 'memberName', label: 'Name', placeholder: 'Full name', input: true },
            { type: 'email', key: 'memberEmail', label: 'Email', placeholder: 'Email', input: true },
            { type: 'select', key: 'memberRole', label: 'Role', input: true, data: { values: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }, { label: 'Manager', value: 'manager' }] } },
          ],
        },
        {
          type: 'editgrid', key: 'projects', label: 'Projects (Edit Grid)', input: true,
          components: [
            { type: 'textfield', key: 'projectName', label: 'Project Name', placeholder: 'My Project', input: true },
            { type: 'textarea', key: 'projectDesc', label: 'Description', placeholder: 'Brief description...', input: true },
            { type: 'number', key: 'projectBudget', label: 'Budget ($)', input: true },
          ],
        },
        {
          type: 'datamap', key: 'settings', label: 'Application Settings (Data Map)', input: true,
          keyLabel: 'Setting Key',
        },
      ],
    },
    // --- Advanced components ---
    {
      type: 'panel', key: 'advancedPanel', label: 'Advanced Components', title: 'Survey, Address, Nested Form & reCAPTCHA',
      input: false, collapsible: true, theme: 'warning',
      components: [
        {
          type: 'survey', key: 'satisfaction', label: 'Satisfaction Survey', input: true,
          questions: [
            { label: 'Overall Experience', value: 'overall' },
            { label: 'UI Design', value: 'design' },
            { label: 'Performance', value: 'performance' },
            { label: 'Documentation', value: 'docs' },
          ],
          values: [
            { label: 'Very Poor', value: '1' },
            { label: 'Poor', value: '2' },
            { label: 'Neutral', value: '3' },
            { label: 'Good', value: '4' },
            { label: 'Excellent', value: '5' },
          ],
        },
        { type: 'address', key: 'homeAddress', label: 'Home Address', input: true },
        {
          type: 'form', key: 'emergencyContact', label: 'Emergency Contact (Nested Form)', input: true,
          title: 'Emergency Contact Info',
          components: [
            { type: 'textfield', key: 'ec_name', label: 'Contact Name', placeholder: 'Jane Doe', input: true },
            { type: 'textfield', key: 'ec_phone', label: 'Contact Phone', placeholder: '555-1234', input: true },
            { type: 'textfield', key: 'ec_relation', label: 'Relationship', placeholder: 'Spouse, Parent, etc.', input: true },
          ],
        },
        { 
          type: 'content', key: 'richNotes', label: 'Rich Text Notes (WYSIWYG)', input: true, 
          html: '<p>This is a <strong>Tiptap</strong> powered <em>rich-text editor</em>. Try editing me!</p>' 
        },
        { type: 'recaptcha', key: 'captcha', label: 'reCAPTCHA Verification', input: false },
      ],
    },
    { type: 'hidden', key: 'formVersion', label: 'Form Version', input: true, defaultValue: '2.0.0' },
    { type: 'button', key: 'submit', label: 'Submit Application', input: false, action: 'submit', theme: 'primary', block: true },
  ],
})

// ─── Wizard Form Schema ──────────────────────────────────────
const wizardSchema = ref<FormSchema>({
  display: 'wizard',
  components: [
    {
      type: 'panel', key: 'step1', label: 'Personal Details', title: 'Personal Details', input: false,
      components: [
        { type: 'textfield', key: 'wiz_firstName', label: 'First Name', placeholder: 'Enter first name', input: true, validate: { required: true } },
        { type: 'textfield', key: 'wiz_lastName', label: 'Last Name', placeholder: 'Enter last name', input: true, validate: { required: true } },
        { type: 'email', key: 'wiz_email', label: 'Email', placeholder: 'you@example.com', input: true, validate: { required: true } },
        { type: 'phoneNumber', key: 'wiz_phone', label: 'Phone', input: true },
      ],
    },
    {
      type: 'panel', key: 'step2', label: 'Professional Info', title: 'Professional Info', input: false,
      components: [
        {
          type: 'select', key: 'wiz_role', label: 'Job Role', input: true,
          data: { values: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }, { label: 'Manager', value: 'manager' }, { label: 'Analyst', value: 'analyst' }] },
          validate: { required: true },
        },
        { type: 'number', key: 'wiz_yearsExp', label: 'Years of Experience', input: true, validate: { required: true, min: 0, max: 50 } },
        { type: 'currency', key: 'wiz_salary', label: 'Expected Salary', input: true, currency: 'USD' },
        {
          type: 'selectboxes', key: 'wiz_skills', label: 'Skills', input: true,
          values: [{ label: 'JavaScript', value: 'js' }, { label: 'Python', value: 'py' }, { label: 'Design', value: 'design' }, { label: 'DevOps', value: 'devops' }],
          validate: { required: true, minSelectedCount: 1 },
        },
      ],
    },
    {
      type: 'panel', key: 'step3', label: 'Additional & Submit', title: 'Additional & Submit', input: false,
      components: [
        { type: 'textarea', key: 'wiz_coverLetter', label: 'Cover Letter', placeholder: 'Write a brief cover letter...', input: true, rows: 4, validate: { minWords: 5 } },
        { type: 'file', key: 'wiz_resume', label: 'Upload Resume', input: true },
        { type: 'checkbox', key: 'wiz_terms', label: 'I agree to the terms and conditions', input: true, validate: { required: true } },
      ],
    },
  ],
})

// ─── Form state ───────────────────────────────────────────────
const formData = ref<Record<string, unknown>>({ formVersion: '2.0.0' })
const wizardData = ref<Record<string, unknown>>({})
const submitted = ref(false)
const submittedData = ref<Record<string, unknown> | null>(null)

function handleSubmit(submission: FormSubmission) {
  submitted.value = true
  submittedData.value = submission.data
  setTimeout(() => { submitted.value = false }, 4000)
}

function handleWizardSubmit(submission: FormSubmission) {
  submitted.value = true
  submittedData.value = submission.data
  setTimeout(() => { submitted.value = false }, 4000)
}

// ─── Builder Schema ───────────────────────────────────────────
const builderSchema = ref<FormSchema>({
  display: 'form',
  components: [],
})

// ─── i18n toggle ──────────────────────────────────────────────
function toggleLanguage() {
  setLanguage(currentLanguage.value === 'en' ? 'id' : 'en')
}

// ─── Debounced Live Data display (avoid JSON.stringify on every keystroke) ──
const formDataJson = ref('{}')
const wizardDataJson = ref('{}')
let _formJsonTimer: ReturnType<typeof setTimeout> | null = null
let _wizardJsonTimer: ReturnType<typeof setTimeout> | null = null

watch(formData, (data) => {
  if (_formJsonTimer) clearTimeout(_formJsonTimer)
  _formJsonTimer = setTimeout(() => {
    formDataJson.value = JSON.stringify(data, null, 2)
  }, 200)
}, { deep: true })

watch(wizardData, (data) => {
  if (_wizardJsonTimer) clearTimeout(_wizardJsonTimer)
  _wizardJsonTimer = setTimeout(() => {
    wizardDataJson.value = JSON.stringify(data, null, 2)
  }, 200)
}, { deep: true })

// Initial render
onMounted(() => {
  formDataJson.value = JSON.stringify(formData.value, null, 2)
})
</script>

<template>
  <div class="demo-page">
    <!-- Hero -->
    <header class="demo-header">
      <div class="demo-header__content">
        <h1 class="demo-header__title">
          <span class="demo-header__icon">⚡</span>
          Form.io Re-Architecture
        </h1>
        <p class="demo-header__subtitle">
          36 field types · Wizard mode · Calculated values · i18n · Full JSON schema
        </p>
      </div>
    </header>

    <!-- Tab Navigation -->
    <nav class="demo-tabs">
      <button
        class="demo-tabs__btn"
        :class="{ 'demo-tabs__btn--active': activeTab === 'renderer' }"
        @click="activeTab = 'renderer'"
      >
        🎨 Form Renderer
      </button>
      <button
        class="demo-tabs__btn"
        :class="{ 'demo-tabs__btn--active': activeTab === 'wizard' }"
        @click="activeTab = 'wizard'"
      >
        🧙 Wizard Mode
      </button>
      <button
        class="demo-tabs__btn"
        :class="{ 'demo-tabs__btn--active': activeTab === 'builder' }"
        @click="activeTab = 'builder'"
      >
        🔧 Form Builder
      </button>
      <!-- i18n Toggle -->
      <button class="demo-tabs__btn demo-tabs__btn--lang" @click="toggleLanguage">
        🌐 {{ currentLanguage.toUpperCase() }}
      </button>
    </nav>

    <!-- Standard Renderer -->
    <div v-if="activeTab === 'renderer'" class="demo-content">
      <div class="demo-layout">
        <div class="demo-layout__main">
          <Transition name="success-toast" mode="out-in">
            <div v-if="submitted" class="demo-success">
              <span class="demo-success__icon">✅</span>
              <div>
                <strong>Form submitted successfully!</strong>
                <p>All data captured. Check the Live Data panel.</p>
              </div>
            </div>
          </Transition>

          <FormRenderer
            :schema="demoSchema"
            v-model="formData"
            show-errors-on="blur"
            submit-label="Submit Application"
            :show-reset="true"
            @submit="handleSubmit"
          />
        </div>

        <!-- Sidebar: Live Data -->
        <aside class="demo-layout__sidebar">
          <div class="demo-data-panel">
            <h3 class="demo-data-panel__title">📊 Live Data</h3>
            <pre class="demo-data-panel__code">{{ formDataJson }}</pre>
          </div>
          <div v-if="submittedData" class="demo-data-panel demo-data-panel--submitted">
            <h3 class="demo-data-panel__title">✅ Submitted Data</h3>
            <pre class="demo-data-panel__code">{{ JSON.stringify(submittedData, null, 2) }}</pre>
          </div>
        </aside>
      </div>
    </div>

    <!-- Wizard Mode -->
    <div v-if="activeTab === 'wizard'" class="demo-content">
      <div class="demo-layout">
        <div class="demo-layout__main demo-layout__main--dark">
          <Transition name="success-toast" mode="out-in">
            <div v-if="submitted" class="demo-success demo-success--dark">
              <span class="demo-success__icon">✅</span>
              <div>
                <strong>Wizard form submitted!</strong>
                <p>All steps complete. Check Live Data.</p>
              </div>
            </div>
          </Transition>

          <FormRenderer
            :schema="wizardSchema"
            v-model="wizardData"
            show-errors-on="blur"
            @submit="handleWizardSubmit"
          />
        </div>

        <!-- Sidebar: Live Data -->
        <aside class="demo-layout__sidebar">
          <div class="demo-data-panel">
            <h3 class="demo-data-panel__title">📊 Wizard Live Data</h3>
            <pre class="demo-data-panel__code">{{ wizardDataJson }}</pre>
          </div>
          <div v-if="submittedData" class="demo-data-panel demo-data-panel--submitted">
            <h3 class="demo-data-panel__title">✅ Submitted Data</h3>
            <pre class="demo-data-panel__code">{{ JSON.stringify(submittedData, null, 2) }}</pre>
          </div>
        </aside>
      </div>
    </div>

    <!-- Builder -->
    <div v-if="activeTab === 'builder'" class="demo-content">
      <FormBuilder v-model:schema="builderSchema" />
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 30%, #0f172a 100%);
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Hero ─────────────────────────────────────── */
.demo-header {
  padding: 2.5rem 2rem 1.5rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%);
}

.demo-header__content { max-width: 700px; margin: 0 auto; }

.demo-header__title {
  font-size: 2rem; font-weight: 800; margin: 0;
  background: linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
}

.demo-header__icon { -webkit-text-fill-color: initial; font-size: 1.75rem; }

.demo-header__subtitle {
  margin: 0.5rem 0 0; font-size: 0.9375rem;
  color: #94a3b8; letter-spacing: -0.01em;
}

/* ── Tabs ─────────────────────────────────────── */
.demo-tabs {
  display: flex; justify-content: center; gap: 0.5rem;
  padding: 0.5rem 2rem 1.5rem; flex-wrap: wrap;
}

.demo-tabs__btn {
  padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 600;
  border: 1.5px solid rgba(99,102,241,0.2); border-radius: 0.5rem;
  background: transparent; color: #94a3b8; cursor: pointer;
  transition: all 0.2s ease; font-family: inherit;
}

.demo-tabs__btn:hover { background: rgba(99,102,241,0.08); color: #c7d2fe; }

.demo-tabs__btn--active {
  background: rgba(99,102,241,0.15); color: #a5b4fc;
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 0 20px rgba(99,102,241,0.1);
}

.demo-tabs__btn--lang {
  border-color: rgba(34,197,94,0.3);
  color: #86efac;
}

.demo-tabs__btn--lang:hover {
  background: rgba(34,197,94,0.1);
}

/* ── Content ──────────────────────────────────── */
.demo-content { max-width: 1280px; margin: 0 auto; padding: 0 2rem 3rem; }

.demo-layout { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; align-items: start; }

@media (max-width: 960px) { .demo-layout { grid-template-columns: 1fr; } }

.demo-layout__main {
  background: #ffffff; border-radius: 0.75rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
  padding: 2rem;
}

.demo-layout__main--dark {
  background: linear-gradient(180deg, #1e1b4b 0%, #1a1a3e 100%);
  border: 1px solid rgba(99,102,241,0.2);
}

/* ── Live Data Panel ──────────────────────────── */
.demo-layout__sidebar { position: sticky; top: 1rem; }

.demo-data-panel {
  background: #1e1e3f; border-radius: 0.75rem;
  border: 1px solid rgba(99,102,241,0.2);
  overflow: hidden; margin-bottom: 1rem;
}

.demo-data-panel--submitted { border-color: rgba(34,197,94,0.3); }

.demo-data-panel__title {
  margin: 0; padding: 0.75rem 1rem;
  font-size: 0.8125rem; font-weight: 600;
  background: rgba(99,102,241,0.08);
  border-bottom: 1px solid rgba(99,102,241,0.15);
}

.demo-data-panel--submitted .demo-data-panel__title { background: rgba(34,197,94,0.08); border-bottom-color: rgba(34,197,94,0.15); }

.demo-data-panel__code {
  margin: 0; padding: 1rem; font-size: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #c7d2fe; overflow-x: auto; max-height: 480px;
  line-height: 1.5; white-space: pre-wrap; word-break: break-all;
}

/* ── Success Toast ────────────────────────────── */
.demo-success {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem 1.25rem; margin-bottom: 1.25rem;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 0.5rem; color: #166534;
}

.demo-success--dark {
  background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3);
  color: #86efac;
}

.demo-success__icon { font-size: 1.5rem; }
.demo-success strong { font-size: 0.875rem; }
.demo-success p { margin: 0.25rem 0 0; font-size: 0.75rem; color: #15803d; }
.demo-success--dark p { color: #4ade80; }

.success-toast-enter-active, .success-toast-leave-active { transition: all 0.3s ease; }
.success-toast-enter-from { transform: translateY(-10px); opacity: 0; }
.success-toast-leave-to { transform: translateY(-10px); opacity: 0; }
</style>
