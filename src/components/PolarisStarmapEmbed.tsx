import { useMemo } from 'react'

type Props = {
  html?: string | null
  title?: string
}

export function PolarisStarmapEmbed({ html, title }: Props) {
  const srcDoc = useMemo(() => {
    const content = (html || '').toString()
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;background:#fff;color:#111;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;}</style></head><body>${content}</body></html>`
  }, [html])

  return (
    <iframe
      title={title || 'Polaris Starmap'}
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
      style={{ width: '100%', height: '70vh', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: '#fff' }}
    />
  )
}

export default PolarisStarmapEmbed
