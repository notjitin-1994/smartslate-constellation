type AnyReq = any
type AnyRes = any

function clearCookie(name: string, opts: { domain?: string; secure: boolean; sameSite: 'None' | 'Lax' }) {
  const parts = [
    `${name}=`,
    'Path=/',
    'HttpOnly',
    opts.secure ? 'Secure' : undefined,
    `SameSite=${opts.sameSite}`,
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    opts.domain ? `Domain=${opts.domain}` : undefined,
  ].filter(Boolean) as string[]
  return parts.join('; ')
}

export default async function handler(req: AnyReq, res: AnyRes) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString()
  const xfProto = (req.headers['x-forwarded-proto'] || '').toString()
  const isLocal = /localhost|127\.0\.0\.1|\.smartslate\.test(?::|$)/i.test(host)
  const isHttps = xfProto === 'https' || /^https:/i.test((req.headers.referer as string) || '')
  const secure = isHttps && !isLocal
  const sameSite: 'None' | 'Lax' = secure ? 'None' : 'Lax'
  const domain = secure ? '.smartslate.io' : undefined
  const setCookie = clearCookie('ss_session', { secure, sameSite, domain })
  res.setHeader('Set-Cookie', setCookie)
  res.setHeader('Cache-Control', 'no-store')
  res.statusCode = 204
  res.end()
}


