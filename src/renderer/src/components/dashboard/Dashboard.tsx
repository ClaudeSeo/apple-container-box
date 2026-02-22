import { useContainers } from '@/hooks/useContainers'
import { useUIStore } from '@/stores'
import { QuickStats } from './QuickStats'
import { ResourceOverview } from './ResourceOverview'
import { ContainerCard } from '@/components/containers/ContainerCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ArrowRight, Box, Clock, Activity } from 'lucide-react'

/**
 * 대시보드 컴포넌트
 * - 시스템 개요
 * - 빠른 통계
 * - 최근 컨테이너
 */
export function Dashboard(): JSX.Element {
  const { containers, loading } = useContainers()
  const { setActiveView } = useUIStore()

  // 최근 실행 중인 컨테이너 (최대 4개로 조정)
  const recentContainers = containers
    .filter((c) => c.status === 'running')
    .slice(0, 4)

  const currentTime = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date())

  return (
    <ScrollArea className="h-full bg-[#000000]/20">
      <div className="mx-auto max-w-[1400px] space-y-8 p-8">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[#8E8E93]">
              {currentTime}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4 text-[#8E8E93]">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>Real-time monitoring active</span>
            </div>
          </div>
        </div>

        {/* 상단: 종합 현황 섹션 (2행 구성) */}
        <div className="space-y-4">
          {/* 라이브러리 통계 (4개 카드) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <QuickStats />
          </div>
          
          {/* 시스템 리소스 (3개 카드) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <ResourceOverview />
            <div className="hidden lg:block rounded-2xl border border-white/5 bg-[#1C1C1E]/30 p-5 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-[#30D158]" />
                  <span className="text-[10px] font-bold text-[#48484A] uppercase tracking-widest">System Health</span>
               </div>
               <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                  Real-time monitoring active. Performance is optimized for macOS.
               </p>
            </div>
          </div>
        </div>

        {/* 메인 섹션: 실행 중인 컨테이너 (전체 너비) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-[#0A84FF]" />
              <h2 className="text-xl font-bold text-white tracking-tight">Active Containers</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveView('containers')}
              className="text-[#0A84FF] hover:text-[#0A84FF] hover:bg-[#0A84FF]/10"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {loading && recentContainers.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl text-[#8E8E93]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A84FF] border-t-transparent" />
                <p className="text-sm font-medium">Scanning Docker environment...</p>
              </div>
            </div>
          ) : recentContainers.length === 0 ? (
            <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl transition-all duration-300">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <Box className="h-8 w-8 text-[#48484A]" />
              </div>
              <p className="text-lg font-bold text-white">No active containers</p>
              <p className="mb-6 text-sm text-[#8E8E93]">Your running containers will appear here.</p>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setActiveView('containers')}
              >
                Create New Container
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentContainers.map((container) => (
                <ContainerCard key={container.id} container={container} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
