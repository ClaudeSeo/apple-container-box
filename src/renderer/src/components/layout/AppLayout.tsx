import { useUIStore } from '@/stores'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { DetailPanel } from './DetailPanel'
import { CommandPalette } from '@/components/common/CommandPalette'

/**
 * 앱 레이아웃 컴포넌트
 * 3-Pane 레이아웃: TitleBar + (Sidebar | MainContent | DetailPanel)
 */
export default function AppLayout(): JSX.Element {
  const { detailPanelVisible } = useUIStore()

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* 타이틀바 (macOS frameless window) */}
      <TitleBar />

      {/* 메인 영역 (타이틀바 높이만큼 패딩) */}
      <div className="flex flex-1 overflow-hidden pt-12">
        {/* 사이드바 */}
        <Sidebar />

        {/* 메인 콘텐츠 */}
        <MainContent />

        {/* 상세 패널 (컨테이너 선택 시 표시) */}
        {detailPanelVisible && <DetailPanel />}
      </div>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  )
}
