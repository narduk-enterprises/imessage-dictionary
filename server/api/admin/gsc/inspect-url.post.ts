import { z } from 'zod'

const bodySchema = z.object({
  url: z.string().url(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const siteUrl = config.public.appUrl || ''

  if (!siteUrl) {
    throw createError({ statusCode: 500, statusMessage: 'SITE_URL not configured' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const gscSiteUrl = `sc-domain:${new URL(siteUrl).hostname}`

  try {
    const data = await googleApiFetch(
      `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
      GSC_SCOPES,
      {
        method: 'POST',
        body: JSON.stringify({
          inspectionUrl: body.url,
          siteUrl: gscSiteUrl,
        }),
      },
    )

    return data
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: `URL Inspection Error: ${err.statusMessage || err.message}`,
    })
  }
})
