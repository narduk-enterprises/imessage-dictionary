<script setup lang="ts">
import type { DictionaryEntry, SearchResult } from '~~/server/utils/types'

const route = useRoute()
const term = computed(() => decodeURIComponent(route.params.term as string))

// eslint-disable-next-line atx/no-fetch-in-component
const { data: entry, status } = await useFetch<DictionaryEntry>(`/api/words/${encodeURIComponent(term.value)}`, {
  key: `word-${term.value}`,
})

// If word not found, fetch suggestions
// eslint-disable-next-line atx/no-fetch-in-component
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
  twitterCard: 'summary_large_image',
})

if (entry.value) {
  defineOgImageComponent('DefaultTakumi', {
    title: entry.value.term,
    description: entry.value.senses?.[0]?.gloss || '',
    pos: entry.value.senses?.[0]?.pos || '',
  })
}

function getShareUrl(senseIdx?: number) {
  const base = `/w/${encodeURIComponent(entry.value?.term || term.value)}`
  return senseIdx && senseIdx > 0 ? `${base}/${senseIdx}` : base
}

async function copyLink() {
  if (!import.meta.client) return
  try {
    // eslint-disable-next-line nuxt-guardrails/no-ssr-dom-access
    const url = `${window.location.origin}${getShareUrl(activeSenseIndex.value)}`
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link copied to clipboard!', color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to copy link', color: 'error' })
  }
}

async function shareWord() {
  if (!import.meta.client) return
  if (navigator.share && entry.value) {
    const sense = entry.value.senses[activeSenseIndex.value]
    try {
      await navigator.share({
        title: `${entry.value.term} — definition`,
        text: sense?.gloss || '',
        // eslint-disable-next-line nuxt-guardrails/no-ssr-dom-access
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
  if (!import.meta.client) return
  try {
    // eslint-disable-next-line nuxt-guardrails/no-ssr-dom-access
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
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-[#6b5e50] hover:text-[#1a2744] transition-colors mb-8"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span class="text-sm font-medium">Back to Home</span>
      </NuxtLink>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-[#d97706]" />
      </div>

      <!-- Word Not Found -->
      <div v-else-if="!entry" class="text-center py-12 bg-white border border-[#d4c9b8] rounded-xl p-8">
        <UIcon name="i-lucide-book-open" class="size-16 mx-auto mb-4 text-[#d4c9b8]" />
        <h1 class="font-serif text-3xl font-bold text-[#1a2744] mb-4">
          Word Not Found
        </h1>
        <p class="text-lg text-[#6b5e50] mb-6">
          We couldn't find a definition for "{{ term }}".
        </p>

        <div v-if="suggestions?.results?.length" class="mb-6">
          <p class="text-sm uppercase tracking-wider text-[#8a8078] mb-3">
            Suggestions
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <NuxtLink
              v-for="s in suggestions.results"
              :key="s.term"
              :to="`/w/${encodeURIComponent(s.term)}`"
              class="px-3 py-1.5 bg-white border border-[#d4c9b8] rounded-lg text-sm font-medium text-[#1a2744] hover:border-[#d97706] transition-colors"
            >
              {{ s.term }}
            </NuxtLink>
          </div>
        </div>

        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1a2744] text-white font-semibold rounded-xl hover:bg-[#0f1a30] transition-colors"
        >
          Search for another word
        </NuxtLink>
      </div>

      <!-- Word Detail -->
      <template v-else>
        <article class="mb-8">
          <div class="mb-8">
            <h1 class="font-serif text-5xl md:text-6xl font-bold text-[#1a2744] tracking-tight">
              {{ entry.term }}
            </h1>
          </div>

          <!-- Senses -->
          <div class="space-y-6">
            <div
              v-for="(sense, index) in entry.senses"
              :key="index"
              class="bg-white border-2 rounded-xl p-6 cursor-pointer transition-colors"
              :class="index === activeSenseIndex ? 'border-[#d97706]' : 'border-[#d4c9b8] hover:border-[#d97706]/50'"
              @click="activeSenseIndex = index"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div v-if="sense.pos" class="text-sm uppercase tracking-widest text-[#d97706] font-semibold mb-3">
                    {{ sense.pos }}
                  </div>
                  <p class="font-serif text-xl leading-relaxed text-[#1a2744] mb-4">
                    {{ sense.gloss }}
                  </p>
                  <div v-if="sense.example" class="pl-4 border-l-4 border-[#d97706]/30">
                    <p class="font-serif text-lg italic text-[#6b5e50]">
                      "{{ sense.example }}"
                    </p>
                  </div>
                </div>
                <UButton
                  v-if="entry.senses.length > 1"
                  class="ml-2 p-2 text-[#8a8078] hover:text-[#d97706] transition-colors"
                  variant="ghost"
                  color="neutral"
                  title="Copy link to this definition"
                  @click.stop="copySenseLink(index)"
                >
                  <UIcon name="i-lucide-copy" class="size-4" />
                </UButton>
              </div>
            </div>
          </div>
        </article>

        <!-- Share Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          <UButton
            size="xl"
            class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2744] hover:bg-[#0f1a30] text-white font-semibold rounded-xl transition-colors"
            @click="copyLink"
          >
            <UIcon name="i-lucide-copy" class="size-5" />
            Copy Link
          </UButton>
          <UButton
            size="xl"
            class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold rounded-xl transition-colors"
            @click="shareWord"
          >
            <UIcon name="i-lucide-share" class="size-5" />
            Share
          </UButton>
        </div>

        <!-- iMessage Preview -->
        <section class="mb-8">
          <h2 class="text-sm uppercase tracking-wider text-[#8a8078] mb-3 font-medium">
            iMessage Preview
          </h2>
          <div class="bg-[#e8e2d8] rounded-xl p-6 border border-[#d4c9b8]">
            <img
              :src="`/_og/d/c_OgImageDefaultTakumi,title_${encodeURIComponent(entry.term)},description_${encodeURIComponent(entry.senses[activeSenseIndex]?.gloss || '')},pos_${encodeURIComponent(entry.senses[activeSenseIndex]?.pos || '')}.png`"
              :alt="`OG image preview for ${entry.term}`"
              class="rounded-lg shadow-sm max-w-lg w-full"
              loading="lazy"
            />
          </div>
        </section>

        <!-- Source Attribution -->
        <div class="pt-8 border-t border-[#d4c9b8]">
          <p class="text-sm text-[#8a8078]">
            Source: {{ entry.source }} • {{ entry.license }}
            <br>
            <NuxtLink to="/attribution" class="text-[#d97706] hover:underline">
              View full attribution
            </NuxtLink>
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
