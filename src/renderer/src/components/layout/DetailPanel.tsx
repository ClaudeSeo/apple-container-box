import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useContainerStore, type DetailTab } from '@/stores'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContainerLogViewer } from '@/components/containers/ContainerLogViewer'
import { ContainerStats } from '@/components/containers/ContainerStats'
import { ContainerShell } from '@/components/containers/ContainerShell'
import { ContainerInspect } from '@/components/containers/ContainerInspect'
import { StatusBadge } from '@/components/containers/StatusBadge'

/**
 * 상세 패널 컴포넌트
 * - 컨테이너 선택 시 우측에 표시
 * - Logs, Stats, Shell, Inspect 탭
 */
export function DetailPanel(): JSX.Element {
  const {
    selectedContainerId,
    detailPanelVisible,
    activeDetailTab,
    setSelectedContainer,
    setActiveDetailTab
  } = useUIStore()
  const { containers } = useContainerStore()

  const selectedContainer = containers.find((c) => c.id === selectedContainerId)

  // running이 아닌데 shell/stats 탭이 활성화된 경우 logs로 폴백
  if (
    selectedContainer &&
    selectedContainer.status !== 'running' &&
    (activeDetailTab === 'shell' || activeDetailTab === 'stats')
  ) {
    setActiveDetailTab('logs')
  }

  if (!detailPanelVisible || !selectedContainer) {
    return <></>
  }

  const handleClose = (): void => {
    setSelectedContainer(null)
  }

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col bg-card border-l border-border',
        'animate-in slide-in-from-right duration-200'
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">
              {selectedContainer.name}
            </h3>
            <StatusBadge status={selectedContainer.status} showLabel={false} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{selectedContainer.image}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="ml-2 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs
        value={activeDetailTab}
        onValueChange={(value) => setActiveDetailTab(value as DetailTab)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-4">
          <TabsTrigger value="logs" className="text-xs">
            Logs
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="text-xs"
            disabled={selectedContainer.status !== 'running'}
          >
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="shell"
            className="text-xs"
            disabled={selectedContainer.status !== 'running'}
          >
            Shell
          </TabsTrigger>
          <TabsTrigger value="inspect" className="text-xs">
            Inspect
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="logs" className="m-0 h-full">
            <ContainerLogViewer containerId={selectedContainerId!} key={selectedContainerId} />
          </TabsContent>
          <TabsContent value="stats" className="m-0 h-full overflow-auto p-4">
            <ContainerStats containerId={selectedContainerId!} key={selectedContainerId} />
          </TabsContent>
          <TabsContent value="shell" className="m-0 h-full">
            <ContainerShell containerId={selectedContainerId!} key={selectedContainerId} />
          </TabsContent>
          <TabsContent value="inspect" className="m-0 h-full">
            <ContainerInspect containerId={selectedContainerId!} key={selectedContainerId} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
