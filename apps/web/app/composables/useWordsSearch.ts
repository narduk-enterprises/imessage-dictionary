import type { SearchResult } from '~~/server/utils/types'

export function useWordsSearch(query: Ref<string>) {
  const { data } = useFetch<{ results: SearchResult[] }>(
    () => `/api/words/search?q=${encodeURIComponent(query.value)}&limit=10`,
    { watch: [query] },
  )
  return computed(() => (query.value.trim() ? (data.value?.results ?? []) : []))
}
