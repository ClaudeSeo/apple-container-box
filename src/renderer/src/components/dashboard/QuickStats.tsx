import { useEffect, useState } from 'react'
import { Image, Layers, Activity, HardDrive } from 'lucide-react'
import { selectContainerStats, useContainerStore } from '@/stores'
import { StatCard } from './StatCard'

/**
 * 빠른 통계 카드 그리드
 */
export function QuickStats(): JSX.Element {
  const { containers } = useContainerStore()
  const stats = selectContainerStats(containers)
  const [imageCount, setImageCount] = useState<number | null>(null)
  const [volumeCount, setVolumeCount] = useState<number | null>(null)

  useEffect(() => {
    window.electronAPI.system.getInfo().then((info) => {
      setImageCount(info.imageCount)
      setVolumeCount(info.volumeCount)
    })
  }, [])

  return (
    <>
      <StatCard
        icon={Activity}
        label="Running Containers"
        value={stats.running}
        variant="blue"
      />
      <StatCard
        icon={Layers}
        label="Total Containers"
        value={stats.total}
        variant="purple"
      />
      <StatCard
        icon={Image}
        label="Docker Images"
        value={imageCount ?? '-'}
        variant="green"
      />
      <StatCard
        icon={HardDrive}
        label="Volumes"
        value={volumeCount ?? '-'}
        variant="orange"
      />
    </>
  )
}
