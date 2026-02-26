import { z } from 'zod'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const apiKey = config.posthogApiKey || ''
  const projectId = config.posthogProjectId || ''
  const domain = new URL(config.public.appUrl || 'https://localhost').hostname

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'POSTHOG_PERSONAL_API_KEY not configured' })
  }
  if (!projectId) {
    throw createError({ statusCode: 500, statusMessage: 'POSTHOG_PROJECT_ID not configured' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)
  const dateFrom = query.startDate || '-30d'
  const dateTo = query.endDate === 'now' ? undefined : query.endDate

  try {
    const res = await $fetch<Record<string, unknown>>(
      `https://us.posthog.com/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          query: {
            kind: 'TrendsQuery',
            dateRange: {
              date_from: dateFrom,
              date_to: dateTo,
            },
            series: [
              { kind: 'EventsNode', event: '$pageview', math: 'total', name: 'Pageviews' },
              { kind: 'EventsNode', event: '$pageview', math: 'dau', name: 'Unique Visitors' },
            ],
            properties: {
              type: 'AND',
              values: [
                {
                  type: 'AND',
                  values: [
                    { key: '$current_url', value: domain, operator: 'icontains', type: 'event' },
                  ],
                },
              ],
            },
          },
        },
      },
    )

    return res
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number; message?: string }
    throw createError({
      statusCode: err.status || err.statusCode || 500,
      statusMessage: `PostHog Error: ${err.message}`,
    })
  }
})
