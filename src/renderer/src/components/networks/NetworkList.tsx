/**
 * 네트워크 목록 컴포넌트
 */

import { useState } from 'react'
import { Network as NetworkIcon, Search, Trash2, Plus, RefreshCw, Info, MoreHorizontal } from 'lucide-react'
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
import { useNetworks } from '@/hooks/useNetworks'
import { NetworkCreateDialog } from './NetworkCreateDialog'
import { InspectDialog } from '@/components/common/InspectDialog'
import { formatRelativeTime } from '@/lib/format'
import type { Network } from '@/types'

interface NetworkListProps {
  onInspect?: (network: Network) => void
}

export function NetworkList(_props: NetworkListProps) {
  const { networks, loading, refetch, deleteNetwork } = useNetworks()
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [inspectedNetwork, setInspectedNetwork] = useState<unknown>(null)
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false)

  const filteredNetworks = networks.filter((network) => {
    const searchLower = search.toLowerCase()
    return (
      (network.name ?? '').toLowerCase().includes(searchLower) ||
      (network.driver ?? '').toLowerCase().includes(searchLower) ||
      (network.id ?? '').toLowerCase().includes(searchLower)
    )
  })

  const isSystemNetwork = (name: string) => name === 'default' || name === 'bridge' || name === 'host' || name === 'none'

  const handleDelete = async (network: Network) => {
    // 시스템 네트워크는 삭제 불가
    if (isSystemNetwork(network.name)) {
      return
    }
    if (deleting) return
    setDeleting(network.id)
    try {
      await deleteNetwork(network.id)
    } finally {
      setDeleting(null)
    }
  }

  const handleInspect = async (network: Network) => {
    const data = await window.electronAPI.networks.inspect(network.id)
    setInspectedNetwork(data)
    setInspectDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-[#000000]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF5AF2] text-white shadow-lg">
            <NetworkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Networks</h2>
            <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest mt-0.5">
              {networks.length} Docker Networks
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
            Create Network
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#0A84FF] transition-colors" />
          <Input
            placeholder="Filter networks by name or driver..."
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
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">ID</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Driver</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Subnet</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Gateway</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNetworks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#8E8E93] py-20 border-none">
                    <div className="flex flex-col items-center gap-3">
                      <NetworkIcon className="h-10 w-10 text-[#48484A]" />
                      <p>{loading ? 'Loading networks...' : 'No networks found'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNetworks.map((network) => (
                  <TableRow key={network.id} className="border-white/5 hover:bg-white/5 group">
                    <TableCell className="font-semibold text-white py-4">
                      <div className="flex items-center gap-2">
                        {network.name}
                        {isSystemNetwork(network.name) && (
                          <span className="px-1.5 py-0.5 bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20 text-[9px] font-bold uppercase tracking-wider rounded">
                            system
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[#8E8E93]">
                      {network.id.slice(0, 12)}
                    </TableCell>
                    <TableCell>
                      <span className="bg-[#8E8E93]/10 border border-[#8E8E93]/20 text-[#8E8E93] text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {network.driver}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[#E5E5E7]">
                      {network.subnet || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[#E5E5E7]">
                      {network.gateway || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-[#8E8E93]">
                      {formatRelativeTime(network.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8E93] hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2C2C2E] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => handleInspect(network)} className="focus:bg-white/10 focus:text-white">
                            <Info className="w-4 h-4 mr-2" />
                            Inspect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(network)}
                            disabled={deleting === network.id || isSystemNetwork(network.name)}
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
      <NetworkCreateDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) refetch()
        }}
      />

      {/* Inspect Dialog */}
      <InspectDialog
        title={`Network: ${inspectedNetwork && typeof inspectedNetwork === 'object' && 'name' in inspectedNetwork ? (inspectedNetwork as Network).name : 'Inspect'}`}
        data={inspectedNetwork}
        open={inspectDialogOpen}
        onOpenChange={setInspectDialogOpen}
      />
    </div>
  )
}
