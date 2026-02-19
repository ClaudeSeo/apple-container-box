/**
 * 네트워크 목록 컴포넌트
 */

import { useState } from 'react'
import { Network as NetworkIcon, Search, Trash2, Plus, RefreshCw, Info } from 'lucide-react'
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

  const isSystemNetwork = (name: string) => name === 'default'

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <NetworkIcon className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Networks</h2>
          <span className="text-sm text-muted-foreground">({networks.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Network
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search networks..."
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
              <TableHead>ID</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Subnet</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNetworks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {loading ? 'Loading networks...' : 'No networks found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredNetworks.map((network) => (
                <TableRow key={network.id}>
                  <TableCell className="font-medium">
                    {network.name}
                    {isSystemNetwork(network.name) && (
                      <span className="ml-2 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                        system
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {network.id.slice(0, 12)}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 bg-surface rounded text-sm">{network.driver}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {network.subnet || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {network.gateway || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(network.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleInspect(network)}>
                          <Info className="w-4 h-4 mr-2" />
                          Inspect
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(network)}
                          disabled={deleting === network.id || isSystemNetwork(network.name)}
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
