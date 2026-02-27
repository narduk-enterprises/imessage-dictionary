<script setup lang="ts">
useSeoMeta({
  title: 'Attribution — iMessage Dictionary',
  description: 'Data sources, licenses, and credits for the iMessage Dictionary project.',
})
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

      <h1 class="font-serif text-4xl font-bold text-[var(--color-primary-500)] mb-8">
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
          <ul class="list-disc list-inside space-y-2 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
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
          <ul class="list-disc list-inside space-y-2 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
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

      <footer class="mt-12 pt-8 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-800)] text-center">
        <p class="text-sm text-[var(--color-neutral-500)]">
          Built with ❤️ by
          <a href="https://nard.uk" class="text-[var(--color-primary-500)] hover:underline">Narduk Enterprises</a>
        </p>
      </footer>
    </div>
  </div>
</template>
