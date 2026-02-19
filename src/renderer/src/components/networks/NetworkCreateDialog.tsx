/**
 * 네트워크 생성 다이얼로그
 */

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useNetworks } from '@/hooks/useNetworks'

interface NetworkCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NetworkCreateDialog({ open, onOpenChange }: NetworkCreateDialogProps) {
  const { createNetwork } = useNetworks()
  const [name, setName] = useState('')
  const [driver, setDriver] = useState('nat')
  const [subnet, setSubnet] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setName('')
      setDriver('nat')
      setSubnet('')
      setCreating(false)
      setError(null)
    }
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Network name is required')
      return
    }

    // 이름 유효성 검사
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
      setError('Invalid network name. Use only alphanumeric, underscore, dot, or dash.')
      return
    }

    // 서브넷 유효성 검사 (선택적)
    if (subnet && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(subnet)) {
      setError('Invalid subnet format. Use CIDR notation (e.g., 172.20.0.0/16)')
      return
    }

    setCreating(true)
    setError(null)

    try {
      await createNetwork(name.trim(), driver, subnet || undefined)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create network')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Network
          </DialogTitle>
          <DialogDescription>Create a new network for container communication.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="network-name">Network Name</Label>
            <Input
              id="network-name"
              placeholder="my-network"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="network-driver">Driver</Label>
            <Select value={driver} onValueChange={setDriver} disabled={creating}>
              <SelectTrigger id="network-driver">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nat">nat</SelectItem>
                <SelectItem value="bridge">bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="network-subnet">Subnet (optional)</Label>
            <Input
              id="network-subnet"
              placeholder="172.20.0.0/16"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">CIDR notation (e.g., 172.20.0.0/16)</p>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
