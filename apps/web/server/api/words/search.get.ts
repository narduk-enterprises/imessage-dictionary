import { z } from 'zod'
import { searchDictionary } from '~~/server/utils/dictionary'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const querySchema = z.object({
    q: z.string().default(''),
    limit: z.coerce.number().default(20)
  })
  const query = await getValidatedQuery(event, querySchema.parse)
  const q = query.q
  const limit = Math.min(query.limit, 50)

  const db = useAppDatabase(event)
  const results = await searchDictionary(db, q, limit)

  setResponseHeaders(event, {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  })

  return { query: q, results }
})
