/**
 * 볼륨 생성 다이얼로그
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
import { useVolumes } from '@/hooks/useVolumes'

interface VolumeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VolumeCreateDialog({ open, onOpenChange }: VolumeCreateDialogProps) {
  const { createVolume } = useVolumes()
  const [name, setName] = useState('')
  const [driver, setDriver] = useState('local')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setName('')
      setDriver('local')
      setCreating(false)
      setError(null)
    }
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Volume name is required')
      return
    }

    // 이름 유효성 검사
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
      setError('Invalid volume name. Use only alphanumeric, underscore, dot, or dash.')
      return
    }

    setCreating(true)
    setError(null)

    try {
      await createVolume(name.trim(), driver)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create volume')
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
            Create Volume
          </DialogTitle>
          <DialogDescription>Create a new volume for persistent data storage.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="volume-name">Volume Name</Label>
            <Input
              id="volume-name"
              placeholder="my-volume"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume-driver">Driver</Label>
            <Select value={driver} onValueChange={setDriver} disabled={creating}>
              <SelectTrigger id="volume-driver">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">local</SelectItem>
              </SelectContent>
            </Select>
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
