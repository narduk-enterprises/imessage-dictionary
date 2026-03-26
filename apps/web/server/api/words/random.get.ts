import { getRandomEntry } from '~~/server/utils/dictionary'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const db = useAppDatabase(event)
  const entry = await getRandomEntry(db)

  if (!entry) {
    throw createError({ statusCode: 404, message: 'No entries found' })
  }

  return entry
})
