import { z } from 'zod'
import { dictionaryEntries } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token || token !== config.adminToken) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, z.object({
    term: z.string().trim().min(1, 'Term and definition are required'),
    gloss: z.string().trim().min(1, 'Term and definition are required'),
    pos: z.string().optional().nullable(),
    example: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    sourceUrl: z.string().optional().nullable(),
    license: z.string().optional().nullable(),
    senses: z.array(z.any()).optional().nullable()
  }).parse)

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
