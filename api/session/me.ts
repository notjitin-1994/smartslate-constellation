import { jwtVerify } from 'jose'

type AnyReq = any
type AnyRes = any

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
    const body = { sub: payload.sub, roles: (payload as any).roles }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  } catch (_err) {
    res.statusCode = 401
    res.end('Unauthorized')
  }
}


