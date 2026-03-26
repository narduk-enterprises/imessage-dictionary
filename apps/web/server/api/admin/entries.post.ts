import { z } from 'zod'
import { dictionaryEntries } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { RATE_LIMIT_POLICIES } from '#layer/server/utils/rateLimit'

const entrySchema = z.object({
  term: z.string().trim().min(1, 'Term and definition are required'),
  gloss: z.string().trim().min(1, 'Term and definition are required'),
  pos: z.string().optional().nullable(),
  example: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  senses: z.array(z.unknown()).optional().nullable(),
})

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT_POLICIES.adminUsers,
    parseBody: withValidatedBody(entrySchema.parse),
  },
  async ({ event, body }) => {
    const db = useAppDatabase(event)
    const term = body.term.toLowerCase().trim()
    const sensesJson = JSON.stringify(body.senses || [{ gloss: body.gloss, pos: body.pos, example: body.example }])

    await db
      .insert(dictionaryEntries)
      .values({
        term,
        pos: body.pos || null,
        gloss: body.gloss.trim(),
        example: body.example || null,
        source: body.source || 'Custom Entry',
        sourceUrl: body.sourceUrl || null,
        license: body.license || 'CC BY-SA 4.0',
        updatedAt: new Date().toISOString(),
        sensesJson,
      })
      .onConflictDoUpdate({
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
  },
)
