import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'
import { TableCell, TableRow } from '@/components/ui/table'
import { StatusBadge } from './StatusBadge'
import { ContainerActions } from './ContainerActions'
import { formatRelativeTime, truncateId } from '@/lib/format'
import type { Container } from '@/types'

interface ContainerTableRowProps {
  container: Container
}

/**
 * 컨테이너 테이블 행 컴포넌트
 */
export function ContainerTableRow({ container }: ContainerTableRowProps): JSX.Element {
  const { selectedContainerId, setSelectedContainer } = useUIStore()
  const isSelected = selectedContainerId === container.id

  const handleClick = (): void => {
    setSelectedContainer(isSelected ? null : container.id)
  }

  // 포트 매핑 문자열 생성
  const portString =
    container.ports
      ?.filter((p) => p.hostPort)
      .map((p) => `${p.hostPort}:${p.containerPort}`)
      .join(', ') || '-'

  return (
    <TableRow
      className={cn(
        'cursor-pointer',
        isSelected && 'bg-primary/10'
      )}
      onClick={handleClick}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{container.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {truncateId(container.id)}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {container.image}
      </TableCell>
      <TableCell>
        <StatusBadge status={container.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">{portString}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatRelativeTime(container.createdAt)}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <ContainerActions containerId={container.id} status={container.status} compact />
      </TableCell>
    </TableRow>
  )
}
