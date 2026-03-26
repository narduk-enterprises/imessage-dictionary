import type { DictionaryEntry, SearchResult } from '~~/server/utils/types'

export function useWordDetails(term: Ref<string>) {
  const normalizedTerm = computed(() => term.value.trim())

  const { data: entry, status } = useFetch<DictionaryEntry>(
    () => `/api/words/${encodeURIComponent(normalizedTerm.value)}`,
    {
      key: computed(() => `word-${normalizedTerm.value}`),
      watch: [normalizedTerm],
    },
  )

  const { data: suggestions } = useFetch<{ results: SearchResult[] }>(
    () => `/api/words/search?q=${encodeURIComponent(normalizedTerm.value)}&limit=5`,
    {
      key: computed(() => `suggestions-${normalizedTerm.value}`),
      watch: [normalizedTerm],
    },
  )

  return {
    entry,
    status,
    suggestions,
  }
}
