import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subLabel?: string
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
}

export function StatCard({ icon: Icon, label, value, subLabel, variant }: StatCardProps): JSX.Element {
  const variants = {
    blue: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20',
    green: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20',
    orange: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20',
    purple: 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/20',
    gray: 'bg-[#8E8E93]/10 text-[#8E8E93] border-[#8E8E93]/20'
  }

  const iconVariants = {
    blue: 'bg-[#0A84FF] text-white',
    green: 'bg-[#30D158] text-white',
    orange: 'bg-[#FF9F0A] text-white',
    purple: 'bg-[#BF5AF2] text-white',
    gray: 'bg-[#8E8E93] text-white'
  }

  return (
    <Card className="group relative overflow-hidden border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl transition-all duration-300 hover:bg-[#1C1C1E]/80 hover:shadow-2xl hover:shadow-black/20">
      <div className={cn('absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 opacity-5 transition-transform duration-500 group-hover:scale-110', variants[variant])}>
        <Icon className="h-full w-full" />
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-lg', iconVariants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
            {subLabel && <p className="text-[10px] font-medium uppercase tracking-wider text-[#8E8E93]">{subLabel}</p>}
          </div>
          <p className="mt-1 text-sm font-medium text-[#8E8E93]">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
