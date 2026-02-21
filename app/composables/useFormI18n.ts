/**
 * ========================================
 * Form i18n Composable
 * ========================================
 * Lightweight localization for form validation messages,
 * labels, and UI strings. Supports template interpolation
 * with {{field}}, {{min}}, {{max}} etc.
 */

import { ref, computed } from 'vue'

export interface TranslationDictionary {
  [key: string]: string
}

// ─── Built-in Translations ─────────────────────────────────
const builtInTranslations: Record<string, TranslationDictionary> = {
  en: {
    required: '{{field}} is required',
    minLength: '{{field}} must be at least {{min}} characters',
    maxLength: '{{field}} must be no more than {{max}} characters',
    min: '{{field}} must be at least {{min}}',
    max: '{{field}} must be no more than {{max}}',
    email: '{{field}} must be a valid email address',
    url: '{{field}} must be a valid URL',
    pattern: '{{field}} does not match the required pattern',
    integer: '{{field}} must be a whole number',
    minWords: '{{field}} must have at least {{min}} words',
    maxWords: '{{field}} must have no more than {{max}} words',
    minSelectedCount: '{{field}} requires at least {{min}} selections',
    maxSelectedCount: '{{field}} allows at most {{max}} selections',
    custom: '{{field}} is invalid',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    cancel: 'Cancel',
    clear: 'Clear',
    save: 'Save',
    close: 'Close',
    loading: 'Loading...',
    noResults: 'No results found',
    searchPlaceholder: 'Type to search...',
    dragDropHint: 'Drag and drop a file or click to upload',
    signHere: 'Sign here',
    page: 'Page {{current}} of {{total}}',
    step: 'Step {{current}}',
  },
  id: {
    required: '{{field}} wajib diisi',
    minLength: '{{field}} minimal {{min}} karakter',
    maxLength: '{{field}} maksimal {{max}} karakter',
    min: '{{field}} minimal {{min}}',
    max: '{{field}} maksimal {{max}}',
    email: '{{field}} harus berupa alamat email yang valid',
    url: '{{field}} harus berupa URL yang valid',
    pattern: '{{field}} tidak sesuai dengan pola yang diperlukan',
    integer: '{{field}} harus berupa bilangan bulat',
    minWords: '{{field}} minimal {{min}} kata',
    maxWords: '{{field}} maksimal {{max}} kata',
    minSelectedCount: '{{field}} minimal {{min}} pilihan',
    maxSelectedCount: '{{field}} maksimal {{max}} pilihan',
    custom: '{{field}} tidak valid',
    submit: 'Kirim',
    next: 'Selanjutnya',
    previous: 'Sebelumnya',
    cancel: 'Batal',
    clear: 'Hapus',
    save: 'Simpan',
    close: 'Tutup',
    loading: 'Memuat...',
    noResults: 'Tidak ada hasil',
    searchPlaceholder: 'Ketik untuk mencari...',
    dragDropHint: 'Seret dan lepas file atau klik untuk mengunggah',
    signHere: 'Tanda tangan di sini',
    page: 'Halaman {{current}} dari {{total}}',
    step: 'Langkah {{current}}',
  },
}

// ─── Singleton state ─────────────────────────────────────
const currentLanguage = ref('en')
const customTranslations = ref<Record<string, TranslationDictionary>>({})

export function useFormI18n() {
  // ─── Active dictionary ──────────────────────────────────
  const dictionary = computed<TranslationDictionary>(() => {
    const lang = currentLanguage.value
    return {
      ...(builtInTranslations[lang] ?? builtInTranslations.en),
      ...(customTranslations.value[lang] ?? {}),
    }
  })

  const availableLanguages = computed(() => {
    const langs = new Set([
      ...Object.keys(builtInTranslations),
      ...Object.keys(customTranslations.value),
    ])
    return Array.from(langs)
  })

  /**
   * Translate a key with template interpolation.
   * @example t('required', { field: 'Email' }) → 'Email is required'
   */
  function t(key: string, params?: Record<string, string | number>): string {
    let template = dictionary.value[key] ?? key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        template = template.replace(
          new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'),
          String(v),
        )
      }
    }

    return template
  }

  /**
   * Set the active language.
   */
  function setLanguage(lang: string): void {
    currentLanguage.value = lang
  }

  /**
   * Register custom translations for a language.
   * Merges with existing translations.
   */
  function addTranslations(lang: string, translations: TranslationDictionary): void {
    customTranslations.value = {
      ...customTranslations.value,
      [lang]: {
        ...(customTranslations.value[lang] ?? {}),
        ...translations,
      },
    }
  }

  /**
   * Register multiple language dictionaries at once.
   */
  function setTranslations(translations: Record<string, TranslationDictionary>): void {
    customTranslations.value = translations
  }

  return {
    // State
    currentLanguage,
    dictionary,
    availableLanguages,

    // Methods
    t,
    setLanguage,
    addTranslations,
    setTranslations,
  }
}
