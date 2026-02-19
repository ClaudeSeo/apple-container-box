/**
 * 볼륨 목록 컴포넌트
 */

import { useState } from 'react'
import { Database, Search, Trash2, Plus, RefreshCw, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useVolumes } from '@/hooks/useVolumes'
import { VolumeCreateDialog } from './VolumeCreateDialog'
import { InspectDialog } from '@/components/common/InspectDialog'
import { formatRelativeTime } from '@/lib/format'
import type { Volume } from '@/types'

interface VolumeListProps {
  onInspect?: (volume: Volume) => void
}

export function VolumeList(_props: VolumeListProps) {
  const { volumes, loading, refetch, deleteVolume } = useVolumes()
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [inspectedVolume, setInspectedVolume] = useState<unknown>(null)
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false)

  const filteredVolumes = volumes.filter((volume) => {
    const searchLower = search.toLowerCase()
    return (
      (volume.name ?? '').toLowerCase().includes(searchLower) ||
      (volume.driver ?? '').toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = async (volume: Volume) => {
    if (deleting) return
    setDeleting(volume.name)
    try {
      await deleteVolume(volume.name)
    } finally {
      setDeleting(null)
    }
  }

  const handleInspect = async (volume: Volume) => {
    const data = await window.electronAPI.volumes.inspect(volume.name)
    setInspectedVolume(data)
    setInspectDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Volumes</h2>
          <span className="text-sm text-muted-foreground">({volumes.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Volume
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search volumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Mount Point</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVolumes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {loading ? 'Loading volumes...' : 'No volumes found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredVolumes.map((volume) => (
                <TableRow key={volume.name}>
                  <TableCell className="font-medium font-mono">{volume.name}</TableCell>
                  <TableCell>
                    <span className="bg-secondary border border-border text-muted-foreground text-xs px-2 py-0.5 rounded-md">{volume.driver}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[300px]">
                    {volume.mountpoint}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(volume.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleInspect(volume)}>
                          <Info className="w-4 h-4 mr-2" />
                          Inspect
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(volume)}
                          disabled={deleting === volume.name}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Create Dialog */}
      <VolumeCreateDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) refetch()
        }}
      />

      {/* Inspect Dialog */}
      <InspectDialog
        title={`Volume: ${inspectedVolume && typeof inspectedVolume === 'object' && 'name' in inspectedVolume ? (inspectedVolume as Volume).name : 'Inspect'}`}
        data={inspectedVolume}
        open={inspectDialogOpen}
        onOpenChange={setInspectDialogOpen}
      />
    </div>
  )
}
