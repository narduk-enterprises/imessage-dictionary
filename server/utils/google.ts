import * as jose from 'jose'

/**
 * Parse the GCP service account credentials from environment.
 * Supports both raw JSON and base64-encoded JSON (Doppler).
 */
function getCredentials() {
  const config = useRuntimeConfig()
  const keyJson = config.googleServiceAccountKey || ''

  if (!keyJson) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Google Service Account key not found in environment (GSC_SERVICE_ACCOUNT_JSON)',
    })
  }

  const trimmed = (keyJson as string).trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Try base64 decode (Doppler stores it base64-encoded)
    const decoded = atob(trimmed)
    return JSON.parse(decoded)
  }
}

/**
 * Generate a signed JWT for Google API authentication using jose (Web Crypto compatible).
 * This is the Cloudflare Workers-recommended approach — no Node.js crypto needed.
 */
async function generateGoogleJWT(scopes: string[]) {
  const credentials = getCredentials()
  const algorithm = 'RS256'

  const privateKey = await jose.importPKCS8(credentials.private_key, algorithm)

  const jwt = await new jose.SignJWT({
    scope: scopes.join(' '),
  })
    .setProtectedHeader({ typ: 'JWT', alg: algorithm, kid: credentials.private_key_id })
    .setIssuer(credentials.client_email)
    .setSubject(credentials.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(privateKey)

  return jwt
}

/**
 * Get an access token for Google APIs using service account JWT.
 * Exchanges the self-signed JWT for an access token via Google's token endpoint.
 */
async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  const jwt = await generateGoogleJWT(scopes)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw createError({
      statusCode: 500,
      statusMessage: `Google token exchange failed: ${error}`,
    })
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

/**
 * Make an authenticated request to a Google API endpoint.
 */
export async function googleApiFetch(url: string, scopes: string[], options?: RequestInit) {
  const accessToken = await getGoogleAccessToken(scopes)

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `Google API error: ${error}`,
    })
  }

  return response.json() as Promise<Record<string, unknown>>
}

// Google API scopes
export const GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
export const GSC_WRITE_SCOPES = ['https://www.googleapis.com/auth/webmasters']
export const GA_SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
