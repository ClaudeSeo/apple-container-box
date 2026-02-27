import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useContainerStats, calculateMemoryPercent } from '@/hooks/useContainerStats'
import { formatBytes, formatPercent } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu, MemoryStick as Memory, ArrowDownCircle, ArrowUpCircle, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContainerStatsProps {
  containerId: string
}

interface ChartDataPoint {
  index: number
  cpu: number
  memory: number
  memoryBytes: number
}

/**
 * 컨테이너 리소스 통계 컴포넌트 (Apple Style Redesign)
 */
export function ContainerStats({ containerId }: ContainerStatsProps): JSX.Element {
  const { currentStats, history, isPolling } = useContainerStats(containerId)
  const isWarmingUp = isPolling && history.length < 2

  // 차트 데이터 포맷팅
  const chartData = useMemo(() => {
    return history.map((point, index) => ({
      index,
      cpu: point.cpuPercent,
      memory: calculateMemoryPercent(point.memoryUsage, point.memoryLimit),
      memoryBytes: point.memoryUsage
    }))
  }, [history])

  const memoryPercent = currentStats
    ? calculateMemoryPercent(currentStats.memoryUsage, currentStats.memoryLimit)
    : 0

  return (
    <div className="space-y-6">
      {/* 현재 통계 요약 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Cpu}
          title="CPU Usage"
          value={
            isWarmingUp
              ? '---'
              : currentStats
                ? formatPercent(currentStats.cpuPercent / 100, 1)
                : '-'
          }
          subLabel={isWarmingUp ? "Warming up..." : "Real-time load"}
          variant="blue"
        />
        <StatCard
          icon={Memory}
          title="Memory"
          value={isWarmingUp ? '---' : currentStats ? formatBytes(currentStats.memoryUsage) : '-'}
          subValue={currentStats ? formatPercent(memoryPercent / 100, 1) : undefined}
          subLabel={isWarmingUp ? "Calculating..." : "Active allocation"}
          variant="purple"
        />
        <StatCard
          icon={ArrowDownCircle}
          title="Network RX"
          value={
            isWarmingUp ? '---' : currentStats ? formatBytes(currentStats.networkRx) : '-'
          }
          subLabel="Total received"
          variant="green"
        />
        <StatCard
          icon={ArrowUpCircle}
          title="Network TX"
          value={
            isWarmingUp ? '---' : currentStats ? formatBytes(currentStats.networkTx) : '-'
          }
          subLabel="Total transmitted"
          variant="orange"
        />
      </div>

      {/* 리소스 히스토리 차트 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CPU History */}
        <ChartCard
          title="CPU Performance"
          icon={Cpu}
          data={chartData}
          dataKey="cpu"
          color="#0A84FF"
          gradientId="cpuGradient"
          isWarmingUp={isWarmingUp}
        />

        {/* Memory History */}
        <ChartCard
          title="Memory Footprint"
          icon={Memory}
          data={chartData}
          dataKey="memory"
          color="#BF5AF2"
          gradientId="memGradient"
          isWarmingUp={isWarmingUp}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string
  subValue?: string
  subLabel?: string
  variant: 'blue' | 'purple' | 'green' | 'orange'
}

function StatCard({ icon: Icon, title, value, subValue, subLabel, variant }: StatCardProps): JSX.Element {
  const variants = {
    blue: 'text-[#0A84FF] bg-[#0A84FF]/10',
    purple: 'text-[#BF5AF2] bg-[#BF5AF2]/10',
    green: 'text-[#30D158] bg-[#30D158]/10',
    orange: 'text-[#FF9F0A] bg-[#FF9F0A]/10'
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl p-4 transition-all duration-300 hover:bg-[#1C1C1E]/80">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("p-1.5 rounded-lg", variants[variant])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-white tracking-tight">{value}</span>
        {subValue && <span className="text-xs font-bold text-[#8E8E93]">{subValue}</span>}
      </div>
      <p className="mt-1 text-[10px] font-medium text-[#48484A]">{subLabel}</p>
    </div>
  )
}

interface ChartCardProps {
  title: string
  icon: LucideIcon
  data: ChartDataPoint[]
  dataKey: 'cpu' | 'memory'
  color: string
  gradientId: string
  isWarmingUp: boolean
}

function ChartCard({ title, icon: Icon, data, dataKey, color, gradientId, isWarmingUp }: ChartCardProps) {
  return (
    <Card className="border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color }} />
            <CardTitle className="text-[13px] font-bold uppercase tracking-wider text-[#8E8E93]">{title}</CardTitle>
        </div>
        <Activity className="h-3 w-3 text-[#30D158] opacity-50" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-40 relative">
          {isWarmingUp && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Collecting history...</p>
              </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="index" hide />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#48484A', fontSize: 10, fontWeight: 'bold' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2C2C2E',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                labelStyle={{ display: 'none' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, title.split(' ')[0]]}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
