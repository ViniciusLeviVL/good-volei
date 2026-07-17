import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface IEmptyStateProps {
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
  readonly className?: string
  readonly action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: IEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-border/80 border-dashed bg-muted/30 px-4 py-8 text-center',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="max-w-xs text-muted-foreground text-xs">{description}</p>
      </div>
      {action}
    </div>
  )
}
