import { searchDictionary } from '~~/server/utils/dictionary'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string) || ''
  const limit = Math.min(Number(query.limit) || 20, 50)

  const db = useDatabase()
  const results = await searchDictionary(db, q, limit)

  setResponseHeaders(event, {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  })

  return { query: q, results }
})
