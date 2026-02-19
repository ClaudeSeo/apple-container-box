import { useState } from 'react'
import { LayoutGrid, List, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContainers } from '@/hooks/useContainers'
import { useUIStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ContainerCard } from './ContainerCard'
import { ContainerTableRow } from './ContainerTableRow'
import { ContainerCreateDialog } from './ContainerCreateDialog'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ViewMode = 'card' | 'table'

/**
 * 컨테이너 목록 컴포넌트
 */
export function ContainerList(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { containers, loading, refetch } = useContainers()
  const { searchQuery, setSearchQuery } = useUIStore()

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search containers..."
            className="w-64"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 뷰 모드 전환 */}
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* 생성 버튼 */}
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Container
          </Button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        {loading && containers.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : containers.length === 0 ? (
          <EmptyState
            title="No containers"
            description={
              searchQuery
                ? 'No containers match your search'
                : 'Create a new container to get started'
            }
            action={
              searchQuery
                ? { label: 'Clear search', onClick: () => setSearchQuery('') }
                : { label: 'Create Container', onClick: () => setCreateDialogOpen(true) }
            }
          />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {containers.map((container) => (
              <ContainerCard key={container.id} container={container} />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((container) => (
                <ContainerTableRow key={container.id} container={container} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 생성 다이얼로그 */}
      <ContainerCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
