import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
  ],

  primevue: {
    options: {
      theme: {
        preset: Aura,
      }
    }
  },

  // Enable TypeScript strict mode
  typescript: {
    strict: true,
  },

  // Auto-import composables & components
  components: [
    {
      path: '~/components/form',
      pathPrefix: false,
    },
    {
      path: '~/components/form/fields',
      pathPrefix: false,
    },
  ],

  // SSR configuration
  ssr: true,

  app: {
    head: {
      title: 'Form.io Nuxt — Modern Form Builder',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Modern form renderer and builder powered by Nuxt 4, Vue 3 Composition API, and TypeScript. Compatible with Form.io JSON schema.',
        },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
    },
  },
})
