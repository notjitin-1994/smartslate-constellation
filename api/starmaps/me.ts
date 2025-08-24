import { jwtVerify } from 'jose'

type AnyReq = any
type AnyRes = any

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

function getEnvSecret(): Uint8Array {
  return new TextEncoder().encode(getEnv('SESSION_JWT_SECRET'))
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=')
    if (!name) return
    out[name] = decodeURIComponent(rest.join('='))
  })
  return out
}

export default async function handler(req: AnyReq, res: AnyRes) {
  try {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Allow', 'GET')
      res.end('Method Not Allowed')
      return
    }

    const origin = req.headers.origin as string | undefined
    if (origin) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }

    const cookies = parseCookies(req.headers.cookie)
    const token = cookies['ss_session']
    if (!token) {
      res.statusCode = 401
      res.end('Unauthorized')
      return
    }

    const secret = getEnvSecret()
    const { payload } = await jwtVerify(token, secret, { issuer: 'app.smartslate.io', audience: 'smartslate.io' })
    const userId = payload.sub as string

    // Query Polaris/Supabase directly via service role key (server-side only)
    const polarisUrl = getEnv('POLARIS_SUPABASE_URL')
    const polarisServiceKey = getEnv('POLARIS_SUPABASE_SERVICE_ROLE_KEY')

    const url = new URL('/rest/v1/starmaps', polarisUrl)
    url.searchParams.set('select', '*')
    url.searchParams.set('created_by', `eq.${userId}`)
    url.searchParams.set('order', 'updated_at.desc')

    const rsp = await fetch(url.toString(), {
      headers: {
        'apikey': polarisServiceKey,
        'Authorization': `Bearer ${polarisServiceKey}`,
        'Content-Type': 'application/json',
      },
      // cookies not needed; service role used
    })

    if (!rsp.ok) {
      const txt = await rsp.text()
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Polaris fetch failed', status: rsp.status, body: txt }))
      return
    }

    const starmaps = await rsp.json()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ starmaps }))
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }))
  }
}

export const config = { api: { bodyParser: false } }


