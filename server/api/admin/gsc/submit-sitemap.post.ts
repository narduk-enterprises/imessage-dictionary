export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const siteUrl = config.public.appUrl || ''

  if (!siteUrl) {
    throw createError({ statusCode: 500, statusMessage: 'SITE_URL not configured' })
  }

  const gscSiteUrl = `sc-domain:${new URL(siteUrl).hostname}`
  const sitemapUrl = `${siteUrl.replace(/\/$/, '')}/sitemap.xml`

  await googleApiFetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    GSC_WRITE_SCOPES,
    { method: 'PUT' },
  )

  return { success: true, sitemapUrl }
})
