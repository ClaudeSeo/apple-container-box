import { type ReactNode } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

interface ResizablePaneProps {
  children: ReactNode
  rightPanel?: ReactNode
  rightPanelVisible?: boolean
  defaultRightPanelSize?: number
  minRightPanelSize?: number
  maxRightPanelSize?: number
}

/**
 * 리사이즈 가능한 패널 컴포넌트
 * - 메인 콘텐츠와 상세 패널 사이 크기 조절
 */
export function ResizablePane({
  children,
  rightPanel,
  rightPanelVisible = false,
  defaultRightPanelSize = 30,
  minRightPanelSize = 20,
  maxRightPanelSize = 50
}: ResizablePaneProps): JSX.Element {
  if (!rightPanelVisible || !rightPanel) {
    return <>{children}</>
  }

  return (
    <Group orientation="horizontal" className="flex-1">
      <Panel id="main" minSize={50} defaultSize={100 - defaultRightPanelSize}>
        {children}
      </Panel>
      <Separator className="relative w-px bg-border hover:bg-accent transition-colors">
        <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
      </Separator>
      <Panel id="detail" minSize={minRightPanelSize} maxSize={maxRightPanelSize} defaultSize={defaultRightPanelSize}>
        {rightPanel}
      </Panel>
    </Group>
  )
}

interface ResizeHandleProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

/**
 * 리사이즈 핸들 컴포넌트
 */
export function ResizeHandle({
  className,
  orientation = 'vertical'
}: ResizeHandleProps): JSX.Element {
  return (
    <Separator
      className={cn(
        'relative transition-colors hover:bg-accent',
        orientation === 'vertical' ? 'w-px bg-border' : 'h-px bg-border',
        className
      )}
    >
      <div
        className={cn(
          'absolute',
          orientation === 'vertical'
            ? 'inset-y-0 -left-1 -right-1 cursor-col-resize'
            : 'inset-x-0 -top-1 -bottom-1 cursor-row-resize'
        )}
      />
    </Separator>
  )
}
