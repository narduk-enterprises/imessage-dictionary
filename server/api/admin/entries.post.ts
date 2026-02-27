import { dictionaryEntries } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token || token !== config.adminToken) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)

  if (!body.term?.trim() || !body.gloss?.trim()) {
    throw createError({ statusCode: 400, message: 'Term and definition are required' })
  }

  const db = useDatabase()
  const term = body.term.toLowerCase().trim()
  const sensesJson = JSON.stringify(body.senses || [{ gloss: body.gloss, pos: body.pos, example: body.example }])

  await db.insert(dictionaryEntries).values({
    term,
    pos: body.pos || null,
    gloss: body.gloss.trim(),
    example: body.example || null,
    source: body.source || 'Custom Entry',
    sourceUrl: body.sourceUrl || null,
    license: body.license || 'CC BY-SA 4.0',
    updatedAt: new Date().toISOString(),
    sensesJson,
  }).onConflictDoUpdate({
    target: dictionaryEntries.term,
    set: {
      pos: body.pos || null,
      gloss: body.gloss.trim(),
      example: body.example || null,
      source: body.source || 'Custom Entry',
      sourceUrl: body.sourceUrl || null,
      license: body.license || 'CC BY-SA 4.0',
      updatedAt: new Date().toISOString(),
      sensesJson,
    },
  })

  return { success: true, term }
})
