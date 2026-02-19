import { useEffect } from 'react'
import { Trash2, ArrowDownToLine, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContainerLogs } from '@/hooks/useContainerLogs'
import '@xterm/xterm/css/xterm.css'

interface ContainerLogViewerProps {
  containerId: string
}

/**
 * 컨테이너 로그 뷰어 컴포넌트
 * - xterm.js 기반 터미널
 * - 실시간 스트리밍
 * - 자동 스크롤 토글
 */
export function ContainerLogViewer({ containerId }: ContainerLogViewerProps): JSX.Element {
  const {
    containerRef,
    isStreaming,
    startLogs,
    stopLogs,
    clearLogs,
    toggleAutoScroll,
    autoScroll
  } = useContainerLogs(containerId)

  // 언마운트 시 로그 스트림 정지
  useEffect(() => {
    return () => {
      stopLogs()
    }
  }, [stopLogs])

  return (
    <div className="flex h-full flex-col">
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isStreaming ? 'Streaming...' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* 스트리밍 토글 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={isStreaming ? stopLogs : startLogs}
            title={isStreaming ? 'Pause' : 'Resume'}
          >
            {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>

          {/* 자동 스크롤 토글 */}
          <Button
            variant={autoScroll ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={toggleAutoScroll}
            title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </Button>

          {/* 클리어 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearLogs}
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 터미널 */}
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className="flex-1 bg-[#0a0c10]" />
    </div>
  )
}
