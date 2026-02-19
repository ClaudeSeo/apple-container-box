import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatBytes } from '@/lib/format'

interface SystemResources {
  cpuUsage: number
  memoryUsed: number
  memoryTotal: number
  diskUsed: number
  diskTotal: number
}

/**
 * 시스템 리소스 개요 컴포넌트
 * - CPU, 메모리, 디스크 실시간 사용량 표시 (5초 폴링)
 */
export function ResourceOverview(): JSX.Element {
  const [resources, setResources] = useState<SystemResources | null>(null)

  useEffect(() => {
    const fetch = () => {
      window.electronAPI.system.getResources().then((data: SystemResources) => {
        setResources(data)
      })
    }

    fetch()
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [])

  const memoryPercent = resources ? (resources.memoryUsed / resources.memoryTotal) * 100 : 0
  const diskPercent = resources ? (resources.diskUsed / resources.diskTotal) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">System Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CPU</span>
            <span className="font-medium text-foreground">
              {resources !== null ? `${resources.cpuUsage}%` : '-'}
            </span>
          </div>
          <Progress value={resources?.cpuUsage ?? 0} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Memory</span>
            <span className="font-medium text-foreground">
              {resources
                ? `${formatBytes(resources.memoryUsed)} / ${formatBytes(resources.memoryTotal)}`
                : '-'}
            </span>
          </div>
          <Progress value={memoryPercent} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Disk</span>
            <span className="font-medium text-foreground">
              {resources
                ? `${formatBytes(resources.diskUsed)} / ${formatBytes(resources.diskTotal)}`
                : '-'}
            </span>
          </div>
          <Progress value={diskPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
