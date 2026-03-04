export function useRandomWord() {
  const { execute, data } = useFetch<{ term?: string }>('/api/words/random', {
    immediate: false,
  })
  return { fetchRandom: execute, randomData: data }
}
