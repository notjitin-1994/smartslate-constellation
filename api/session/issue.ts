import { SignJWT } from 'jose'
import { cookieDomainFor } from '../../src/lib/cookieDomain'

type AnyReq = any
type AnyRes = any

const FIFTEEN_MINUTES_SECONDS = 15 * 60

function getEnvSecret(): string {
  const secret = process.env.SESSION_JWT_SECRET
  if (!secret) throw new Error('SESSION_JWT_SECRET is not set')
  return secret
}

function makeCookie(name: string, value: string, opts: { domain?: string; maxAgeSeconds: number }) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    `Max-Age=${opts.maxAgeSeconds}`,
  ]
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  const expires = new Date(Date.now() + opts.maxAgeSeconds * 1000).toUTCString()
  parts.push(`Expires=${expires}`)
  return parts.join('; ')
}

async function readJsonBody(req: AnyReq): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString('utf8') })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (err) { reject(err) }
    })
    req.on('error', reject)
  })
}

export default async function handler(req: AnyReq, res: AnyRes) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.end('Method Not Allowed')
      return
    }

    const url = new URL(req.url || '/', `https://${req.headers['x-forwarded-host'] || req.headers.host || 'app.smartslate.io'}`)
    const redirectTo = url.searchParams.get('redirectTo') || undefined

    const { sub, roles } = await readJsonBody(req)
    if (!sub) {
      res.statusCode = 400
      res.end('Missing sub')
      return
    }
    const jwtSecret = new TextEncoder().encode(getEnvSecret())
    const token = await new SignJWT({ sub, roles })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer('app.smartslate.io')
      .setAudience('smartslate.io')
      .setExpirationTime('15m')
      .sign(jwtSecret)

    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString()
    const domain = cookieDomainFor(host)
    const setCookie = makeCookie('ss_session', token, { domain, maxAgeSeconds: FIFTEEN_MINUTES_SECONDS })

    res.setHeader('Set-Cookie', setCookie)
    res.setHeader('Cache-Control', 'no-store')

    const origin = req.headers.origin as string | undefined
    if (origin && (/\.smartslate\.io$/i.test(new URL(origin).hostname) || /\.smartslate\.test$/i.test(new URL(origin).hostname))) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }

    if (redirectTo) {
      res.statusCode = 303
      res.setHeader('Location', redirectTo)
      res.end()
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }))
  }
}

export const config = { api: { bodyParser: false } }


