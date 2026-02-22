import { useEffect, useState } from 'react'
import { formatBytes } from '@/lib/format'
import { Cpu, MemoryStick as Memory, HardDrive } from 'lucide-react'
import { StatCard } from './StatCard'

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

  return (
    <>
      <StatCard
        icon={Cpu}
        label="CPU Usage"
        value={resources !== null ? `${resources.cpuUsage}%` : '-'}
        variant="blue"
      />
      <StatCard
        icon={Memory}
        label="Memory"
        value={resources ? formatBytes(resources.memoryUsed) : '-'}
        subLabel={resources ? `/ ${formatBytes(resources.memoryTotal)}` : ''}
        variant="purple"
      />
      <StatCard
        icon={HardDrive}
        label="Disk Space"
        value={resources ? formatBytes(resources.diskUsed) : '-'}
        subLabel={resources ? `/ ${formatBytes(resources.diskTotal)}` : ''}
        variant="gray"
      />
    </>
  )
}
