<script setup lang="ts">
import type { SearchResult } from '~~/server/utils/types'

const query = ref('')
const results = ref<SearchResult[]>([])
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const popularWords = ['serendipity', 'ephemeral', 'eloquent', 'paradigm', 'ubiquitous', 'resilient', 'empathy', 'innovative']

function clearSearch() {
  query.value = ''
  results.value = []
}

watch(query, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val.trim()) {
    results.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    // eslint-disable-next-line atx/no-fetch-in-component
    const data = await $fetch<{ results: SearchResult[] }>('/api/words/search', {
      query: { q: val, limit: 10 },
    })
    if (data) {
      results.value = data.results
    }
  }, 150)
})

async function goToRandom() {
  // eslint-disable-next-line atx/no-fetch-in-component
  const data = await $fetch('/api/words/random')
  if (data?.term) {
    navigateTo(`/w/${encodeURIComponent(data.term)}`)
  }
}

useSeoMeta({
  title: 'iMessage Dictionary — Share Beautiful Word Definitions',
  description: 'Look up words and share beautiful OG preview cards in iMessage. Over 200 curated definitions with one-tap sharing.',
})

defineOgImageComponent('DefaultTakumi', {
  title: 'Free Dictionary',
  description: 'Share beautiful word definitions in iMessage',
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="flex items-center justify-center gap-3 mb-4">
          <UIcon name="i-lucide-book-open" class="text-[#1a2744] size-12" />
          <h1 class="font-serif text-5xl md:text-6xl font-bold text-[#1a2744] tracking-tight">
            Free Dictionary
          </h1>
        </div>
        <p class="text-xl text-[#6b5e50]">
          Share beautiful word definitions in iMessage
        </p>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <UInput
          id="search-input"
          v-model="query"
          size="xl"
          icon="i-lucide-search"
          placeholder="Search for a word..."
          class="w-full"
          :ui="{
            base: 'w-full bg-white border-2 border-[#d4c9b8] focus-within:border-[#d97706] rounded-xl text-lg py-4 px-5',
          }"
        />

        <!-- Search Results -->
        <div v-if="results.length > 0" class="mt-3 bg-white border border-[#d4c9b8] rounded-xl shadow-sm overflow-hidden">
          <NuxtLink
            v-for="entry in results"
            :key="entry.term"
            :to="`/w/${encodeURIComponent(entry.term)}`"
            class="block px-5 py-3 hover:bg-[#f5f1e8] transition-colors border-b border-[#ece5d8] last:border-b-0"
            @click="clearSearch"
          >
            <div class="font-serif font-semibold text-lg text-[#1a2744]">
              {{ entry.term }}
            </div>
            <div class="text-sm text-[#8a8078] line-clamp-1">
              {{ entry.gloss }}
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Random Word Button -->
      <div class="flex justify-center mb-16">
        <UButton
          size="xl"
          class="inline-flex items-center gap-2 px-8 py-3 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold rounded-xl transition-colors shadow-sm"
          @click="goToRandom"
        >
          <UIcon name="i-lucide-shuffle" class="size-5" />
          Random Word
        </UButton>
      </div>

      <!-- Popular Words Grid -->
      <section>
        <h2 class="text-sm uppercase tracking-wider text-[#8a8078] mb-4 font-medium">
          Popular Words
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NuxtLink
            v-for="word in popularWords"
            :key="word"
            :to="`/w/${word}`"
            class="px-4 py-3 bg-white border border-[#d4c9b8] rounded-lg hover:border-[#d97706] transition-colors"
          >
            <span class="font-serif text-lg font-semibold text-[#1a2744]">
              {{ word }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- Footer -->
      <div class="mt-16 pt-8 border-t border-[#d4c9b8] text-center">
        <p class="text-sm text-[#8a8078]">
          All definitions from Demo Dataset under CC BY-SA 4.0
          <br>
          <NuxtLink to="/attribution" class="text-[#d97706] hover:underline">
            View full attribution
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
