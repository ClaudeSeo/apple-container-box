import { Play, Square, RotateCcw, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useContainerActions } from '@/hooks/useContainers'
import type { ContainerStatus } from '@/types'

interface ContainerActionsProps {
  containerId: string
  status: ContainerStatus
  compact?: boolean
}

/**
 * 컨테이너 액션 버튼 그룹
 */
export function ContainerActions({
  containerId,
  status,
  compact = false
}: ContainerActionsProps): JSX.Element {
  const { startContainer, stopContainer, restartContainer, removeContainer, loading } =
    useContainerActions()

  const isRunning = status === 'running'
  const isStopped = status === 'stopped' || status === 'exited' || status === 'created'

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isStopped && (
            <DropdownMenuItem onClick={() => startContainer(containerId)}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </DropdownMenuItem>
          )}
          {isRunning && (
            <>
              <DropdownMenuItem onClick={() => stopContainer(containerId)}>
                <Square className="mr-2 h-4 w-4" />
                Stop
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => restartContainer(containerId)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => removeContainer(containerId, false)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {isStopped && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => startContainer(containerId)}
          disabled={loading}
          title="Start"
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
      {isRunning && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => stopContainer(containerId)}
            disabled={loading}
            title="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => restartContainer(containerId)}
            disabled={loading}
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => removeContainer(containerId, false)}
        disabled={loading}
        title="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
