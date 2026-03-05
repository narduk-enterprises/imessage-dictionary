<script setup lang="ts">
useSeo({
  title: 'Attribution — iMessage Dictionary',
  description: 'Data sources, licenses, and credits for the iMessage Dictionary project.',
})

useWebPageSchema({ name: 'Attribution & Licenses', type: 'AboutPage' })
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <UButton
        variant="ghost"
        icon="i-lucide-arrow-left"
        to="/"
        class="mb-8"
      >
        Back to Home
      </UButton>

      <h1 class="font-serif text-4xl font-bold text-primary-500 mb-8">
        Attribution & Licenses
      </h1>

      <div class="space-y-8">
        <UCard>
          <template #header>
            <h2 class="font-serif text-xl font-semibold">
              Dictionary Data
            </h2>
          </template>
          <p class="mb-3">
            Definitions are sourced from multiple open-access dictionaries and curated datasets, primarily:
          </p>
          <ul class="list-disc list-inside space-y-2 text-muted">
            <li><strong>Wiktionary</strong> — Licensed under CC BY-SA 4.0</li>
            <li><strong>WordNet</strong> (Princeton University) — BSD License</li>
            <li>Custom curated entries — CC BY-SA 4.0</li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-serif text-xl font-semibold">
              Technology
            </h2>
          </template>
          <ul class="list-disc list-inside space-y-2 text-muted">
            <li><strong>Nuxt 4</strong> — Vue.js framework for web applications</li>
            <li><strong>Nuxt UI 4</strong> — UI component library</li>
            <li><strong>Cloudflare Workers</strong> — Edge deployment</li>
            <li><strong>Cloudflare D1</strong> — SQLite database</li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-serif text-xl font-semibold">
              Open Graph Images
            </h2>
          </template>
          <p>
            Dynamic OG preview images are generated server-side for optimal iMessage sharing.
            Typography uses <strong>Crimson Pro</strong> (SIL Open Font License) and
            <strong>Inter</strong> (SIL Open Font License).
          </p>
        </UCard>
      </div>

      <div class="mt-12 pt-8 border-t border-default text-center">
        <p class="text-sm text-muted">
          Built with ❤️ by
          <ULink to="https://nard.uk" class="text-primary-500 hover:underline">Narduk Enterprises</ULink>
        </p>
      </div>
    </div>
  </div>
</template>
