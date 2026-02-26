interface RawSitemapContent {
  type: string
  submitted?: string | number
  indexed?: string | number
}
interface RawSitemap {
  path: string
  lastSubmitted: string
  lastDownloaded: string
  isPending: boolean
  isSitemapsIndex: boolean
  warnings?: number
  errors?: number
  contents?: RawSitemapContent[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const siteUrl = config.public.appUrl || ''

  if (!siteUrl) {
    throw createError({ statusCode: 500, statusMessage: 'SITE_URL not configured' })
  }

  const gscSiteUrl = `sc-domain:${new URL(siteUrl).hostname}`

  try {
    const data = await googleApiFetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/sitemaps`,
      GSC_SCOPES,
    )

    const rawSitemaps = (data as { sitemap?: RawSitemap[] }).sitemap || []
    const sitemaps = rawSitemaps.map((s: RawSitemap) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted,
      lastDownloaded: s.lastDownloaded,
      isPending: s.isPending,
      isSitemapsIndex: s.isSitemapsIndex,
      warnings: s.warnings || 0,
      errors: s.errors || 0,
      contents: (s.contents || []).map((c: RawSitemapContent) => ({
        type: c.type,
        submitted: c.submitted ? Number(c.submitted) : 0,
        indexed: c.indexed ? Number(c.indexed) : 0,
      })),
    }))

    return { sitemaps }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: `GSC Sitemaps Error: ${err.statusMessage || err.message}`,
    })
  }
})
