import { memo, useState } from 'react'

export type NavItem = string | { 
  label: string
  tagText?: string
  tagTone?: 'preview' | 'soon' | 'info' 
}

export interface NavSectionProps {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
  onItemClick?: (item: NavItem) => void
}

export const NavSection = memo(function NavSection({ 
  title, 
  items, 
  defaultOpen = false, 
  onItemClick 
}: NavSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen)

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-primary-500 hover:bg-white/5 rounded-lg transition pressable"
        aria-expanded={open}
        aria-controls={`section-${title.replace(/\s+/g, '-')}`}
      >
        <span>{title}</span>
        <span className={`inline-block text-xs text-primary-500/70 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      <div id={`section-${title.replace(/\s+/g, '-')}`} className={`${open ? 'block' : 'hidden'} mt-1 pl-2`}>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const { label, tagText, tagTone } =
              typeof item === 'string' ? { label: item, tagText: undefined, tagTone: undefined } : item
            return (
              <li key={label}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onItemClick?.(item) }}
                  className="flex items-center justify-between px-3 py-1.5 text-sm text-white/75 hover:text-primary-500 focus-visible:text-primary-500 active:text-primary-500 hover:bg-primary-500/5 rounded-lg transition pressable"
                >
                  <span className="truncate">{label}</span>
                  {tagText && (
                    <span
                      className={`ml-3 shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        tagTone === 'preview'
                          ? 'border-primary-600/30 text-primary-400 bg-primary-600/10'
                          : 'border-white/10 text-white/60 bg-white/5'
                      }`}
                    >
                      {tagText}
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
})
