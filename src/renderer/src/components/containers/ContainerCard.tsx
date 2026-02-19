import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { ContainerActions } from './ContainerActions'
import { formatUptime, truncateId } from '@/lib/format'
import type { Container } from '@/types'

interface ContainerCardProps {
  container: Container
}

/**
 * 개별 컨테이너 카드 컴포넌트
 */
export function ContainerCard({ container }: ContainerCardProps): JSX.Element {
  const { selectedContainerId, setSelectedContainer } = useUIStore()
  const isSelected = selectedContainerId === container.id

  const handleClick = (): void => {
    setSelectedContainer(isSelected ? null : container.id)
  }

  // 포트 매핑 문자열 생성
  const portString = container.ports
    ?.filter((p) => p.hostPort)
    .map((p) => `${p.hostPort}:${p.containerPort}`)
    .join(', ')

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-150',
        'hover:border-primary/30 hover:bg-accent',
        isSelected && 'border-primary/50 bg-accent'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* 이름과 상태 */}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-foreground">{container.name}</h3>
              <StatusBadge status={container.status} showLabel={false} />
            </div>

            {/* 이미지 */}
            <p className="mt-1 truncate text-xs text-muted-foreground">{container.image}</p>

            {/* 메타 정보 */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">{truncateId(container.id)}</span>
              {container.status === 'running' && container.startedAt && (
                <span>Up {formatUptime(Math.floor((Date.now() - new Date(container.startedAt).getTime()) / 1000))}</span>
              )}
              {portString && <span>{portString}</span>}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <ContainerActions containerId={container.id} status={container.status} compact />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
