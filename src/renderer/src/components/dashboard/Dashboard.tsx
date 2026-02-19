import { useContainers } from '@/hooks/useContainers'
import { useUIStore } from '@/stores'
import { QuickStats } from './QuickStats'
import { ResourceOverview } from './ResourceOverview'
import { ContainerCard } from '@/components/containers/ContainerCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

/**
 * 대시보드 컴포넌트
 * - 시스템 개요
 * - 빠른 통계
 * - 최근 컨테이너
 */
export function Dashboard(): JSX.Element {
  const { containers, loading } = useContainers()
  const { setActiveView } = useUIStore()

  // 최근 실행 중인 컨테이너 (최대 6개)
  const recentContainers = containers
    .filter((c) => c.status === 'running')
    .slice(0, 6)

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">System overview and quick stats</p>
        </div>

        {/* 빠른 통계 */}
        <QuickStats />

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 리소스 개요 */}
          <div className="lg:col-span-1">
            <ResourceOverview />
          </div>

          {/* 실행 중인 컨테이너 */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Running Containers</h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('containers')}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {loading && recentContainers.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Loading containers...
              </div>
            ) : recentContainers.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground">No running containers</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setActiveView('containers')}
                >
                  Go to Containers
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {recentContainers.map((container) => (
                  <ContainerCard key={container.id} container={container} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
