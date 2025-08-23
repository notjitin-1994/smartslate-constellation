import { memo, type ComponentType } from 'react'

interface WorkspaceActionCardProps {
  href: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export const WorkspaceActionCard = memo(function WorkspaceActionCard({ 
  href, 
  label, 
  description, 
  icon: Icon 
}: WorkspaceActionCardProps) {
  return (
    <a
      href={href}
      className="group block p-6 glass-card hover:bg-primary-500/5 border-primary-500/20 transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="shrink-0 p-3 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 group-hover:from-primary-500/30 group-hover:to-secondary-500/30 transition-all">
          <Icon className="w-6 h-6 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white mb-1 group-hover:text-primary-500 transition-colors">
            {label}
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </a>
  )
})
