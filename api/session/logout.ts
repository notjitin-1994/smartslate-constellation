type AnyReq = any
type AnyRes = any

function clearCookie(name: string) {
  const parts = [
    `${name}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Domain=.smartslate.io',
  ]
  return parts.join('; ')
}

export default async function handler(_req: AnyReq, res: AnyRes) {
  const setCookie = clearCookie('ss_session')
  res.setHeader('Set-Cookie', setCookie)
  res.setHeader('Cache-Control', 'no-store')
  res.statusCode = 204
  res.end()
}


