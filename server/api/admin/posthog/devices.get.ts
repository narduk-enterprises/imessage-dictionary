import { z } from 'zod'

const querySchema = z.object({
  days: z.string().optional().default('30'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const apiKey = config.posthogApiKey || ''
  const projectId = config.posthogProjectId || ''
  const domain = new URL(config.public.appUrl || 'https://localhost').hostname

  if (!apiKey || !projectId) {
    throw createError({ statusCode: 500, statusMessage: 'PostHog API key or project ID not configured' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)
  const days = parseInt(query.days) || 30

  try {
    const res = await $fetch<{ results?: (string | number)[][] }>(
      `https://us.posthog.com/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          query: {
            kind: 'HogQLQuery',
            query: `
            SELECT
              properties.$device_type AS device,
              count() AS pageviews,
              count(DISTINCT person_id) AS unique_visitors
            FROM events
            WHERE event = '$pageview'
              AND timestamp >= now() - toIntervalDay(${days})
              AND properties.$current_url LIKE '%${domain}%'
            GROUP BY device
            ORDER BY pageviews DESC
          `,
          },
        },
      },
    )

    const rows = (res.results || []).map((row: (string | number)[]) => ({
      device: row[0] || 'Unknown',
      pageviews: row[1] || 0,
      uniqueVisitors: row[2] || 0,
    }))

    return { rows }
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number; message?: string }
    throw createError({
      statusCode: err.status || err.statusCode || 500,
      statusMessage: `PostHog Error: ${err.message}`,
    })
  }
})
