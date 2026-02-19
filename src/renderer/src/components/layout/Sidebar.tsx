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
          'flex flex-col glass-sidebar transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* 메인 네비게이션 */}
        <nav className="flex-1 space-y-1 p-2">
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
        <div className="space-y-1 p-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={cn(
                  'w-full justify-start text-muted-foreground hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </Button>
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

  const button = (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className={cn(
        'w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/30',
        isActive && 'bg-accent/50 text-foreground hover:bg-accent/50',
        isCollapsed && 'justify-center px-0'
      )}
    >
      <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
      {!isCollapsed && <span className="text-sm">{item.label}</span>}
    </Button>
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
