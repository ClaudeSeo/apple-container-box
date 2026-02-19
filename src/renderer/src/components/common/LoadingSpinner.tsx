import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2'
}

/**
 * 로딩 스피너 컴포넌트
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps): JSX.Element {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

interface LoadingOverlayProps {
  message?: string
}

/**
 * 로딩 오버레이 컴포넌트
 */
export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps): JSX.Element {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  )
}
