import { jwtVerify, SignJWT } from 'jose'

type AnyReq = any
type AnyRes = any

const FIFTEEN_MINUTES_SECONDS = 15 * 60

function getEnvSecret(): Uint8Array {
  const secret = process.env.SESSION_JWT_SECRET
  if (!secret) throw new Error('SESSION_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
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

function makeCookie(name: string, value: string, opts: { domain?: string; maxAgeSeconds: number }) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    `Max-Age=${opts.maxAgeSeconds}`,
    `Expires=${new Date(Date.now() + opts.maxAgeSeconds * 1000).toUTCString()}`,
    'Domain=.smartslate.io',
  ]
  return parts.join('; ')
}

export default async function handler(req: AnyReq, res: AnyRes) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      const origin = req.headers.origin as string | undefined
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST, OPTIONS')
      res.end('Method Not Allowed')
      return
    }

    const cookies = parseCookies(req.headers.cookie)
    const token = cookies['ss_session']
    if (!token) {
      res.statusCode = 401
      res.end('Missing session')
      return
    }

    const secret = getEnvSecret()
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'app.smartslate.io',
      audience: 'smartslate.io',
    })

    const newToken = await new SignJWT({ sub: payload.sub, roles: (payload as any).roles })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer('app.smartslate.io')
      .setAudience('smartslate.io')
      .setExpirationTime('15m')
      .sign(secret)

    const setCookie = makeCookie('ss_session', newToken, { maxAgeSeconds: FIFTEEN_MINUTES_SECONDS })

    const origin = req.headers.origin as string | undefined
    if (origin) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }

    res.setHeader('Set-Cookie', setCookie)
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
  } catch (err) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unauthorized' }))
  }
}

export const config = { api: { bodyParser: false } }


