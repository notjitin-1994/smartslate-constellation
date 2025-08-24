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

    // Polaris service config
    const polarisUrl = getEnv('POLARIS_SUPABASE_URL')
    const polarisServiceKey = getEnv('POLARIS_SUPABASE_SERVICE_ROLE_KEY')

    // Optional single fetch by id
    const baseUrl = new URL(req.url || '/', `https://${req.headers['x-forwarded-host'] || req.headers.host || 'app.smartslate.io'}`)
    const id = baseUrl.searchParams.get('id') || undefined

    // Source of truth: polaris_summaries
    const url = new URL('/rest/v1/polaris_summaries', polarisUrl)
    url.searchParams.set('select', '*')
    if (id) {
      url.searchParams.set('id', `eq.${id}`)
      url.searchParams.set('limit', '1')
    } else {
      // try common user columns
      url.searchParams.set('or', `created_by.eq.${userId},user_id.eq.${userId},owner_id.eq.${userId},author_id.eq.${userId}`)
      url.searchParams.set('order', 'updated_at.desc')
    }

    const rsp = await fetch(url.toString(), {
      headers: {
        'apikey': polarisServiceKey,
        'Authorization': `Bearer ${polarisServiceKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!rsp.ok) {
      const txt = await rsp.text()
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Polaris fetch failed', status: rsp.status, body: txt }))
      return
    }

    const rows = await rsp.json()
    const list = Array.isArray(rows) ? rows : []
    const starmaps = list.map((r: any) => {
      const title = r.title || r.name || r.report_title || r.company_name || 'Untitled'
      const description = r.description || r.summary || r.executive_summary || ''
      const created_at = r.created_at || new Date().toISOString()
      const updated_at = r.updated_at || created_at
      const metadata: Record<string, any> = {}
      if (r.category) metadata.category = r.category
      if (r.difficulty) metadata.difficulty = r.difficulty
      if (r.duration) metadata.duration = r.duration
      if (r.tags) metadata.tags = r.tags
      return {
        id: String(r.id),
        title,
        description,
        created_at,
        updated_at,
        metadata,
        source: 'polaris_summaries',
        summary: r.summary,
        cover_image_url: r.cover_image_url,
        tags: r.tags,
        html: r.summary_content || r.html || r.content_html,
        raw: r,
      }
    })

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


