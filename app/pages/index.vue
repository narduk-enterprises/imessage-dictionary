<script setup lang="ts">
import type { SearchResult } from '~~/server/utils/types'

const query = ref('')
const results = ref<SearchResult[]>([])
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const popularWords = ['serendipity', 'ephemeral', 'eloquent', 'paradigm', 'ubiquitous', 'resilient', 'empathy', 'innovative']

watch(query, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val.trim()) {
    results.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    const { data } = await useFetch('/api/words/search', {
      query: { q: val, limit: 10 },
      key: `search-${val}`,
    })
    if (data.value) {
      results.value = data.value.results
    }
  }, 150)
})

async function goToRandom() {
  const data = await $fetch('/api/words/random')
  if (data?.term) {
    navigateTo(`/w/${encodeURIComponent(data.term)}`)
  }
}

useSeoMeta({
  title: 'iMessage Dictionary — Share Beautiful Word Definitions',
  description: 'Look up words and share beautiful OG preview cards in iMessage. Over 200 curated definitions with one-tap sharing.',
  ogTitle: 'iMessage Dictionary',
  ogDescription: 'Share beautiful word definitions in iMessage',
  ogType: 'website',
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Header -->
      <header class="text-center mb-12">
        <div class="flex items-center justify-center gap-3 mb-4">
          <UIcon name="i-lucide-book-open" class="text-[var(--color-primary-500)] size-12" />
          <h1 class="font-serif text-5xl md:text-6xl font-bold text-[var(--color-primary-500)] tracking-tight">
            Free Dictionary
          </h1>
        </div>
        <p class="text-xl text-[var(--color-neutral-500)]">
          Share beautiful word definitions in iMessage
        </p>
      </header>

      <!-- Search -->
      <div class="mb-8">
        <UInput
          id="search-input"
          v-model="query"
          size="xl"
          icon="i-lucide-search"
          placeholder="Search for a word..."
          class="font-serif"
        />

        <!-- Search Results -->
        <UCard v-if="results.length > 0" class="mt-4">
          <div class="space-y-1">
            <NuxtLink
              v-for="entry in results"
              :key="entry.term"
              :to="`/w/${encodeURIComponent(entry.term)}`"
              class="block px-4 py-3 rounded-md hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] transition-colors"
              @click="query = ''; results = []"
            >
              <div class="font-serif font-semibold text-lg">
                {{ entry.term }}
              </div>
              <div class="text-sm text-[var(--color-neutral-500)] line-clamp-1">
                {{ entry.gloss }}
              </div>
            </NuxtLink>
          </div>
        </UCard>
      </div>

      <!-- Random Word Button -->
      <div class="flex justify-center mb-16">
        <UButton
          size="lg"
          icon="i-lucide-shuffle"
          @click="goToRandom"
        >
          Random Word
        </UButton>
      </div>

      <!-- Popular Words Grid -->
      <section>
        <h2 class="text-sm uppercase tracking-wider text-[var(--color-neutral-500)] mb-4 font-medium">
          Popular Words
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NuxtLink
            v-for="word in popularWords"
            :key="word"
            :to="`/w/${word}`"
            class="px-4 py-3 border-2 border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] rounded-lg hover:border-[var(--color-primary-400)] transition-colors"
          >
            <span class="font-serif text-lg font-semibold">
              {{ word }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-16 pt-8 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-800)] text-center">
        <p class="text-sm text-[var(--color-neutral-500)]">
          All definitions from Demo Dataset under CC BY-SA 4.0
          <br>
          <NuxtLink to="/attribution" class="text-[var(--color-primary-500)] hover:underline">
            View full attribution
          </NuxtLink>
        </p>
      </footer>
    </div>
  </div>
</template>
