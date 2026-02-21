<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}

/* Base utility classes to substitute for Tailwind/PrimeFlex */
.w-full { width: 100% !important; }
.h-full { height: 100% !important; }
.flex { display: flex !important; }
.flex-col { flex-direction: column !important; }
.justify-center { justify-content: center !important; }
.justify-between { justify-content: space-between !important; }
.items-center { align-items: center !important; }
.gap-1 { gap: 0.25rem !important; }
.gap-2 { gap: 0.5rem !important; }
.gap-3 { gap: 0.75rem !important; }
.gap-4 { gap: 1rem !important; }
.mt-1 { margin-top: 0.25rem !important; }
.mt-2 { margin-top: 0.5rem !important; }
.mt-3 { margin-top: 0.75rem !important; }
.mt-4 { margin-top: 1rem !important; }
.mb-1 { margin-bottom: 0.25rem !important; }
.mb-2 { margin-bottom: 0.5rem !important; }
.mb-3 { margin-bottom: 0.75rem !important; }
.mb-4 { margin-bottom: 1rem !important; }
.mr-1 { margin-right: 0.25rem !important; }
.mr-2 { margin-right: 0.5rem !important; }
.ml-1 { margin-left: 0.25rem !important; }
.ml-2 { margin-left: 0.5rem !important; }
.p-1 { padding: 0.25rem !important; }
.p-2 { padding: 0.5rem !important; }
.px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
.py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
.font-bold { font-weight: 700 !important; }
.absolute { position: absolute !important; }
.relative { position: relative !important; }
.z-10 { z-index: 10 !important; }
.top-2 { top: 0.5rem !important; }
.right-2 { right: 0.5rem !important; }
.text-xs { font-size: 0.75rem !important; }
</style>
