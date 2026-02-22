import {
  Box,
  HardDrive,
  Image,
  LayoutDashboard,
  Network,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, type ActiveView } from '@/stores'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface NavItem {
  id: ActiveView
  icon: LucideIcon
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'containers', icon: Box, label: 'Containers' },
  { id: 'images', icon: Image, label: 'Images' },
  { id: 'volumes', icon: HardDrive, label: 'Volumes' },
  { id: 'networks', icon: Network, label: 'Networks' }
]

const BOTTOM_NAV_ITEMS: NavItem[] = [{ id: 'settings', icon: Settings, label: 'Settings' }]

/**
 * 사이드바 네비게이션 컴포넌트
 * - 접기/펼치기 가능
 * - 상단: 메인 네비게이션
 * - 하단: 설정
 */
export function Sidebar(): JSX.Element {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col bg-[#1C1C1E]/60 backdrop-blur-2xl border-r border-white/5 transition-all duration-300 pt-11 px-3 pb-3',
          sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* 메인 네비게이션 */}
        <nav className="flex-1 space-y-0.5">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
            Library
          </div>
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              isCollapsed={sidebarCollapsed}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </nav>

        {/* 하단 네비게이션 */}
        <div className="space-y-0.5 mt-auto pt-3 border-t border-white/5">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              isCollapsed={sidebarCollapsed}
              onClick={() => setActiveView(item.id)}
            />
          ))}

          {/* 접기/펼치기 버튼 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={toggleSidebar}
                className={cn(
                  'flex items-center w-full px-2 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 select-none cursor-default text-[#98989D] hover:bg-white/5 hover:text-white',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="mr-2.5 h-4 w-4" />
                    <span>Collapse</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">Expand sidebar</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

interface NavButtonProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}

function NavButton({ item, isActive, isCollapsed, onClick }: NavButtonProps): JSX.Element {
  const Icon = item.icon

  const buttonClass = cn(
    'flex items-center w-full px-2 py-1.5 mb-0.5 text-[13px] font-medium rounded-md transition-all duration-150 select-none cursor-default',
    isActive
      ? 'bg-[#0A84FF] text-white shadow-sm'
      : 'text-[#98989D] hover:bg-white/5 hover:text-white',
    isCollapsed && 'justify-center px-0'
  )

  const button = (
    <div onClick={onClick} className={buttonClass}>
      <Icon className={cn('h-4 w-4 stroke-[2]', !isCollapsed && 'mr-2.5')} />
      {!isCollapsed && <span>{item.label}</span>}
    </div>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}
