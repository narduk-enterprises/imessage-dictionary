export type AdminEntryPayload = {
  term: string
  pos?: string
  gloss: string
  example?: string
  source: string
  license: string
}

export function useSubmitEntry() {
  const { execute, error } = useFetch('/api/admin/entries', {
    method: 'POST',
    immediate: false,
  })
  return {
    submitEntry: (body: AdminEntryPayload, authToken: string) =>
      execute({
        body,
        headers: { Authorization: `Bearer ${authToken}` },
      } as Record<string, unknown>),
    error,
  }
}
