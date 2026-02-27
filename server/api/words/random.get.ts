import { getRandomEntry } from '~~/server/utils/dictionary'

export default defineEventHandler(async () => {
  const db = useDatabase()
  const entry = await getRandomEntry(db)

  if (!entry) {
    throw createError({ statusCode: 404, message: 'No entries found' })
  }

  return entry
})
