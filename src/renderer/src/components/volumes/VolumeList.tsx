/**
 * 볼륨 목록 컴포넌트
 */

import { useState } from 'react'
import { HardDrive, Search, Trash2, Plus, RefreshCw, Info, MoreHorizontal } from 'lucide-react'
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
    <div className="flex flex-col h-full bg-[#000000]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9F0A] text-white shadow-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Volumes</h2>
            <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest mt-0.5">
              {volumes.length} Persistent Volumes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={loading}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 shadow-lg shadow-[#0A84FF]/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Volume
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#0A84FF] transition-colors" />
          <Input
            placeholder="Filter volumes by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#1C1C1E]/50 border-white/5 text-white placeholder:text-[#48484A] focus-visible:ring-[#0A84FF]/50"
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 px-8 pb-8">
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Driver</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Mount Point</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVolumes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#8E8E93] py-20 border-none">
                    <div className="flex flex-col items-center gap-3">
                      <HardDrive className="h-10 w-10 text-[#48484A]" />
                      <p>{loading ? 'Loading volumes...' : 'No volumes found'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVolumes.map((volume) => (
                  <TableRow key={volume.name} className="border-white/5 hover:bg-white/5 group">
                    <TableCell className="font-mono text-xs text-white py-4 max-w-[200px] truncate">
                      {volume.name}
                    </TableCell>
                    <TableCell>
                      <span className="bg-[#8E8E93]/10 border border-[#8E8E93]/20 text-[#8E8E93] text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {volume.driver}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[#8E8E93] truncate max-w-[300px]">
                      {volume.mountpoint}
                    </TableCell>
                    <TableCell className="text-sm text-[#8E8E93]">
                      {formatRelativeTime(volume.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8E93] hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2C2C2E] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => handleInspect(volume)} className="focus:bg-white/10 focus:text-white">
                            <Info className="w-4 h-4 mr-2" />
                            Inspect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(volume)}
                            disabled={deleting === volume.name}
                            className="text-[#FF453A] focus:bg-[#FF453A]/10 focus:text-[#FF453A]"
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
        </div>
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
