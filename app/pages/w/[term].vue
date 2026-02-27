<script setup lang="ts">
import type { DictionaryEntry, SearchResult } from '~~/server/utils/types'

const route = useRoute()
const term = computed(() => decodeURIComponent(route.params.term as string))

const { data: entry, status } = await useFetch<DictionaryEntry>(`/api/words/${encodeURIComponent(term.value)}`, {
  key: `word-${term.value}`,
})

// If word not found, fetch suggestions
const { data: suggestions } = await useFetch<{ results: SearchResult[] }>('/api/words/search', {
  query: { q: term.value, limit: 5 },
  key: `suggestions-${term.value}`,
  immediate: !entry.value,
})

const activeSenseIndex = ref(0)
const toast = useToast()

// Set SEO meta dynamically
useSeoMeta({
  title: () => entry.value ? `${entry.value.term} — iMessage Dictionary` : `${term.value} — Word not found`,
  description: () => entry.value?.senses?.[0]?.gloss || `Definition for ${term.value}`,
  ogTitle: () => entry.value ? `${entry.value.term} — definition` : term.value,
  ogDescription: () => entry.value?.senses?.[0]?.gloss || 'Word not found',
  ogType: 'website',
  ogImage: () => entry.value ? `/api/og/${encodeURIComponent(entry.value.term)}` : undefined,
  twitterCard: 'summary_large_image',
})

function getShareUrl(senseIdx?: number) {
  const base = `/w/${encodeURIComponent(entry.value?.term || term.value)}`
  return senseIdx && senseIdx > 0 ? `${base}/${senseIdx}` : base
}

async function copyLink() {
  try {
    const url = `${window.location.origin}${getShareUrl(activeSenseIndex.value)}`
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link copied to clipboard!', color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to copy link', color: 'error' })
  }
}

async function shareWord() {
  if (navigator.share && entry.value) {
    const sense = entry.value.senses[activeSenseIndex.value]
    try {
      await navigator.share({
        title: `${entry.value.term} — definition`,
        text: sense?.gloss || '',
        url: `${window.location.origin}${getShareUrl(activeSenseIndex.value)}`,
      })
    }
    catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.add({ title: 'Failed to share', color: 'error' })
      }
    }
  }
  else {
    copyLink()
  }
}

async function copySenseLink(index: number) {
  try {
    const url = `${window.location.origin}${getShareUrl(index)}`
    await navigator.clipboard.writeText(url)
    const label = entry.value?.senses[index]?.pos || `definition ${index + 1}`
    toast.add({ title: `Link to "${label}" copied!`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to copy link', color: 'error' })
  }
}
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Back button -->
      <UButton
        variant="ghost"
        icon="i-lucide-arrow-left"
        to="/"
        class="mb-8"
      >
        Back to Home
      </UButton>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-[var(--color-primary-500)]" />
      </div>

      <!-- Word Not Found -->
      <UCard v-else-if="!entry" class="text-center py-12">
        <UIcon name="i-lucide-book-open" class="size-16 mx-auto mb-4 text-[var(--color-neutral-400)]" />
        <h1 class="font-serif text-3xl font-bold mb-4">
          Word Not Found
        </h1>
        <p class="text-lg text-[var(--color-neutral-500)] mb-6">
          We couldn't find a definition for "{{ term }}".
        </p>

        <div v-if="suggestions?.results?.length" class="mb-6">
          <p class="text-sm uppercase tracking-wider text-[var(--color-neutral-500)] mb-3">
            Suggestions
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton
              v-for="s in suggestions.results"
              :key="s.term"
              variant="outline"
              size="sm"
              :to="`/w/${encodeURIComponent(s.term)}`"
            >
              {{ s.term }}
            </UButton>
          </div>
        </div>

        <UButton to="/">
          Search for another word
        </UButton>
      </UCard>

      <!-- Word Detail -->
      <template v-else>
        <article class="mb-8">
          <header class="mb-8">
            <h1 class="font-serif text-5xl md:text-6xl font-bold text-[var(--color-primary-500)] tracking-tight">
              {{ entry.term }}
            </h1>
          </header>

          <!-- Senses -->
          <div class="space-y-6">
            <UCard
              v-for="(sense, index) in entry.senses"
              :key="index"
              :class="{ 'ring-2 ring-[var(--color-primary-400)]': index === activeSenseIndex }"
              @click="activeSenseIndex = index"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div v-if="sense.pos" class="text-sm uppercase tracking-widest text-[var(--color-primary-500)] font-medium mb-3">
                    {{ sense.pos }}
                  </div>
                  <p class="font-serif text-xl leading-relaxed mb-4">
                    {{ sense.gloss }}
                  </p>
                  <div v-if="sense.example" class="pl-4 border-l-4 border-[var(--color-primary-200)]">
                    <p class="font-serif text-lg italic text-[var(--color-neutral-500)]">
                      "{{ sense.example }}"
                    </p>
                  </div>
                </div>
                <UButton
                  v-if="entry.senses.length > 1"
                  variant="ghost"
                  icon="i-lucide-copy"
                  size="sm"
                  class="ml-2"
                  title="Copy link to this definition"
                  @click.stop="copySenseLink(index)"
                />
              </div>
            </UCard>
          </div>
        </article>

        <!-- Share Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          <UButton
            size="lg"
            icon="i-lucide-copy"
            class="flex-1"
            @click="copyLink"
          >
            Copy Link
          </UButton>
          <UButton
            size="lg"
            icon="i-lucide-share"
            variant="soft"
            class="flex-1"
            @click="shareWord"
          >
            Share
          </UButton>
        </div>

        <!-- Source Attribution -->
        <footer class="pt-8 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-800)]">
          <p class="text-sm text-[var(--color-neutral-500)]">
            Source: {{ entry.source }} • {{ entry.license }}
            <br>
            <NuxtLink to="/attribution" class="text-[var(--color-primary-500)] hover:underline">
              View full attribution
            </NuxtLink>
          </p>
        </footer>
      </template>
    </div>
  </div>
</template>
