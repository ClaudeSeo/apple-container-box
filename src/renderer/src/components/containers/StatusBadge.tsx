import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ContainerStatus } from '@/types'

interface StatusBadgeProps {
  status: ContainerStatus
  showLabel?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  ContainerStatus,
  { color: string; bgColor: string; icon: string; label: string }
> = {
  running: {
    color: 'text-status-running',
    bgColor: 'bg-status-running/20 border-status-running/50',
    icon: '',
    label: 'Running'
  },
  stopped: {
    color: 'text-status-stopped',
    bgColor: 'bg-status-stopped/20 border-status-stopped/50',
    icon: '',
    label: 'Stopped'
  },
  error: {
    color: 'text-status-error',
    bgColor: 'bg-status-error/20 border-status-error/50',
    icon: '',
    label: 'Error'
  },
  paused: {
    color: 'text-status-paused',
    bgColor: 'bg-status-paused/20 border-status-paused/50',
    icon: '',
    label: 'Paused'
  },
  restarting: {
    color: 'text-status-restarting',
    bgColor: 'bg-status-restarting/20 border-status-restarting/50',
    icon: '',
    label: 'Restarting'
  },
  created: {
    color: 'text-status-stopped',
    bgColor: 'bg-status-stopped/20 border-status-stopped/50',
    icon: '',
    label: 'Created'
  },
  exited: {
    color: 'text-status-stopped',
    bgColor: 'bg-status-stopped/20 border-status-stopped/50',
    icon: '',
    label: 'Exited'
  },
  removing: {
    color: 'text-status-error',
    bgColor: 'bg-status-error/20 border-status-error/50',
    icon: '',
    label: 'Removing'
  },
  dead: {
    color: 'text-status-error',
    bgColor: 'bg-status-error/20 border-status-error/50',
    icon: '',
    label: 'Dead'
  }
}

/**
 * 컨테이너 상태 배지 컴포넌트
 */
export function StatusBadge({
  status,
  showLabel = true,
  className
}: StatusBadgeProps): JSX.Element {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.stopped

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-normal', config.bgColor, config.color, className)}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'running' && 'animate-pulse',
          config.color.replace('text-', 'bg-')
        )}
      />
      {showLabel && <span className="text-xs">{config.label}</span>}
    </Badge>
  )
}

/**
 * 상태 도트만 표시하는 컴포넌트
 */
export function StatusDot({
  status,
  className
}: {
  status: ContainerStatus
  className?: string
}): JSX.Element {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.stopped

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'running' && 'animate-pulse',
        config.color.replace('text-', 'bg-'),
        className
      )}
      title={config.label}
    />
  )
}
