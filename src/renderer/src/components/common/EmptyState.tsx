import { cn } from '@/lib/utils'
import { LucideIcon, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * 빈 상태 표시 컴포넌트
 * - 데이터가 없거나 검색 결과가 없을 때 사용
 */
export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6" variant="secondary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
