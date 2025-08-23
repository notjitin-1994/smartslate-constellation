export function cookieDomainFor(hostname?: string | null) {
  if (!hostname) return undefined
  if (hostname.endsWith("smartslate.io")) return ".smartslate.io"
  // Local dev convenience: allow cross-subdomain cookies for *.smartslate.test
  if (hostname.endsWith("smartslate.test")) return ".smartslate.test"
  return undefined
}


