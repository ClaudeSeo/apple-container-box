import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'
import { StatusDot } from './StatusBadge'
import { ContainerActions } from './ContainerActions'
import { formatUptime, truncateId } from '@/lib/format'
import type { Container } from '@/types'

interface ContainerCardProps {
  container: Container
}

/**
 * 개별 컨테이너 카드 컴포넌트 (macOS Style)
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
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ease-out cursor-default',
        // 기본 상태: 투명하거나 아주 옅은 배경
        'bg-[#1C1C1E]/50 border-white/5 backdrop-blur-xl hover:bg-[#1C1C1E]/80 hover:border-white/10 hover:shadow-2xl hover:shadow-black/20',
        // 선택 상태: 파란색 테두리 또는 진한 배경
        isSelected && 'bg-[#1C1C1E]/90 border-[#0A84FF]/50 ring-1 ring-[#0A84FF]/20 shadow-2xl shadow-black/40 scale-[1.02]'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4 overflow-hidden">
            {/* 상태 아이콘 (큰 버전) */}
            <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/5 shrink-0 transition-all duration-300 group-hover:scale-110",
                container.status === 'running' && "bg-[#30D158]/10 border-[#30D158]/20 shadow-lg shadow-[#30D158]/5"
            )}>
                 <StatusDot status={container.status} className="h-3 w-3" />
            </div>
            
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-white tracking-tight leading-tight">
                    {container.name}
                </h3>
                <p className="truncate text-xs text-[#8E8E93] font-medium mt-1">
                    {container.image}
                </p>
            </div>
        </div>
        
        {/* 액션 (Hover시 표시) */}
        <div className={cn(
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            isSelected && "opacity-100"
        )} onClick={(e) => e.stopPropagation()}>
             <ContainerActions containerId={container.id} status={container.status} compact />
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
            <span className="font-mono opacity-60">#{truncateId(container.id)}</span>
            {portString && (
                <>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="truncate max-w-[120px]">{portString}</span>
                </>
            )}
        </div>
        
        {container.status === 'running' && container.startedAt && (
             <span className="text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-md border border-[#30D158]/10">
                {formatUptime(Math.floor((Date.now() - new Date(container.startedAt).getTime()) / 1000))}
             </span>
        )}
      </div>
    </div>
  )
}
