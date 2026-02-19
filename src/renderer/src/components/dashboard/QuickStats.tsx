import { useEffect, useState } from 'react'
import { Box, HardDrive, Image, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { selectContainerStats, useContainerStore } from '@/stores'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subLabel?: string
  color?: string
}

function StatCard({ icon: Icon, label, value, subLabel, color }: StatCardProps): JSX.Element {
  return (
    <Card className="glass-panel">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color || 'bg-primary/10'}`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subLabel && <p className="text-xs text-muted-foreground">{subLabel}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Box}
        label="Running"
        value={stats.running}
        subLabel={`of ${stats.total} containers`}
        color="bg-status-running/20"
      />
      <StatCard
        icon={Layers}
        label="Stopped"
        value={stats.stopped}
        color="bg-status-stopped/20"
      />
      <StatCard
        icon={Image}
        label="Images"
        value={imageCount ?? '-'}
      />
      <StatCard
        icon={HardDrive}
        label="Volumes"
        value={volumeCount ?? '-'}
      />
    </div>
  )
}
