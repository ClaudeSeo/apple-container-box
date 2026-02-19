import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

/**
 * 커스텀 타이틀바 컴포넌트
 * - macOS frameless window용 드래그 가능 영역
 * - 트래픽 라이트 버튼 영역 확보
 */
export function TitleBar(): JSX.Element {
  const { activeView } = useUIStore()

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    containers: 'Containers',
    images: 'Images',
    volumes: 'Volumes',
    networks: 'Networks',
    settings: 'Settings'
  }

  return (
    <header
      className={cn(
        'drag-region fixed left-0 right-0 top-0 z-50',
        'flex h-9 items-center glass-titlebar'
      )}
    >
      {/* macOS 트래픽 라이트 버튼 영역 (왼쪽 여백) */}
      <div className="w-20 flex-shrink-0" />

      {/* 중앙 타이틀 */}
      <div className="flex flex-1 items-center justify-center">
        <span className="no-drag text-xs font-medium text-muted-foreground">
          {viewTitles[activeView] || 'Apple Container Box'}
        </span>
      </div>

      {/* 오른쪽 여백 (균형) */}
      <div className="w-20 flex-shrink-0" />
    </header>
  )
}
