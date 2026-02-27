import { getEntryByTerm } from '~~/server/utils/dictionary'

export default defineEventHandler(async (event) => {
  const term = getRouterParam(event, 'term')
  if (!term?.trim()) {
    throw createError({ statusCode: 400, message: 'Missing term parameter' })
  }

  const db = useDatabase()
  const entry = await getEntryByTerm(db, decodeURIComponent(term))

  if (!entry) {
    throw createError({ statusCode: 404, message: 'Word not found' })
  }

  setResponseHeaders(event, {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  })

  return entry
})
