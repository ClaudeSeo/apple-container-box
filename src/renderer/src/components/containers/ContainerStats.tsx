import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useContainerStats, calculateMemoryPercent } from '@/hooks/useContainerStats'
import { formatBytes, formatPercent } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContainerStatsProps {
  containerId: string
}

/**
 * 컨테이너 리소스 통계 컴포넌트
 * - Recharts 기반 라인 차트
 * - CPU, 메모리 사용량
 */
export function ContainerStats({ containerId }: ContainerStatsProps): JSX.Element {
  const { currentStats, history } = useContainerStats(containerId)

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
    <div className="space-y-4">
      {/* 현재 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="CPU"
          value={currentStats ? formatPercent(currentStats.cpuPercent / 100, 1) : '-'}
          color="#007AFF"
        />
        <StatCard
          title="Memory"
          value={currentStats ? formatBytes(currentStats.memoryUsage) : '-'}
          subValue={currentStats ? formatPercent(memoryPercent / 100, 1) : undefined}
          color="#34C759"
        />
      </div>

      {/* CPU 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="index" hide />
                <YAxis
                  domain={[0, 100]}
                  width={40}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #282828',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#007AFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 메모리 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="index" hide />
                <YAxis
                  domain={[0, 100]}
                  width={40}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #282828',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#34C759"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 네트워크 I/O */}
      {currentStats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Network RX" value={formatBytes(currentStats.networkRx)} color="#FF9500" />
          <StatCard title="Network TX" value={formatBytes(currentStats.networkTx)} color="#FF3B30" />
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subValue?: string
  color: string
}

function StatCard({ title, value, subValue, color }: StatCardProps): JSX.Element {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg font-semibold text-foreground">{value}</span>
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
