import { z } from 'zod'

interface PHRawRecording {
  id: string
  start_time: string
  end_time: string
  recording_duration?: number
  active_seconds?: number
  click_count?: number
  keypress_count?: number
  start_url?: string
  person?: { distinct_ids?: string[] }
  distinct_id?: string
}

const querySchema = z.object({
  limit: z.string().optional().default('15'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const apiKey = config.posthogApiKey || ''
  const projectId = config.posthogProjectId || ''

  if (!apiKey || !projectId) {
    throw createError({ statusCode: 500, statusMessage: 'PostHog API key or project ID not configured' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const res = await $fetch<{ results?: PHRawRecording[] }>(
      `https://us.posthog.com/api/projects/${projectId}/session_recordings/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params: {
          limit: query.limit,
          order: '-start_time',
        },
      },
    )

    const recordings = (res.results || []).map((r: PHRawRecording) => ({
      id: r.id,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.recording_duration || 0,
      activeSeconds: r.active_seconds || 0,
      clickCount: r.click_count || 0,
      keypressCount: r.keypress_count || 0,
      startUrl: r.start_url || '',
      personId: r.person?.distinct_ids?.[0] || r.distinct_id || 'Anonymous',
    }))

    return { recordings }
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number; message?: string }
    throw createError({
      statusCode: err.status || err.statusCode || 500,
      statusMessage: `PostHog Error: ${err.message}`,
    })
  }
})
