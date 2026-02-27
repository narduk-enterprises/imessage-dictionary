import type { H3Event } from 'h3'
import { importPKCS8, SignJWT } from 'jose'

export const GA_SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
export const GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

export async function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig(event)
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token || token !== config.adminToken) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}

export async function googleApiFetch(url: string, scopes: string[], options: RequestInit = {}) {
  const credsPath = process.env.GSC_SERVICE_ACCOUNT_JSON_PATH
  const inlineCreds = process.env.GSC_SERVICE_ACCOUNT_JSON

  let credentials
  if (credsPath) {
    try {
      const fs = await import('node:fs/promises')
      credentials = JSON.parse(await fs.readFile(credsPath, 'utf8'))
    } catch {
      // Ignore
    }
  }

  if (!credentials && inlineCreds) {
    let str = inlineCreds
    if (!str.startsWith('{')) {
      str = Buffer.from(str, 'base64').toString('utf8')
    }
    credentials = JSON.parse(str)
  }

  if (!credentials || !credentials.client_email || !credentials.private_key) {
    throw new Error('Google credentials not found or invalid format.')
  }

  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600

  const privateKey = await importPKCS8(credentials.private_key, 'RS256')

  const jwt = await new SignJWT({
    iss: credentials.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey)

  const tokenParams = new URLSearchParams()
  tokenParams.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  tokenParams.append('assertion', jwt)

  const tokenFetch = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  })

  if (!tokenFetch.ok) {
    const err = await tokenFetch.text()
    throw new Error(`Failed to get Google access token: ${err}`)
  }

  const { access_token } = await tokenFetch.json() as { access_token: string }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Google API request failed: ${res.statusText}`)
  }

  return res.json() as Promise<Record<string, any>>
}
