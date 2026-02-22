import { useUIStore } from '@/stores'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { DetailPanel } from './DetailPanel'
import { ResizablePane } from './ResizablePane'
import { CommandPalette } from '@/components/common/CommandPalette'

/**
 * 앱 레이아웃 컴포넌트
 * 3-Pane 레이아웃: TitleBar + (Sidebar | MainContent | DetailPanel)
 */
export default function AppLayout(): JSX.Element {
  const { detailPanelVisible } = useUIStore()

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent relative">
      {/* 타이틀바 (Overlay) */}
      <TitleBar />

      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 & 디테일 패널 */}
      <ResizablePane
        rightPanelVisible={detailPanelVisible}
        rightPanel={<DetailPanel />}
        defaultRightPanelSize={28}
        minRightPanelSize={20}
        maxRightPanelSize={55}
      >
        <MainContent />
      </ResizablePane>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  )
}
