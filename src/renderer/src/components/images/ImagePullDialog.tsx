/**
 * 이미지 Pull 다이얼로그
 */

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { useImages, useImagePullProgress } from '@/hooks/useImages'

interface ImagePullDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImagePullDialog({ open, onOpenChange }: ImagePullDialogProps) {
  const { pullImage } = useImages()
  const { progress, clearProgress } = useImagePullProgress()
  const [imageRef, setImageRef] = useState('')
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setImageRef('')
      setPulling(false)
      setError(null)
      clearProgress()
    }
  }, [open, clearProgress])

  const handlePull = async () => {
    if (!imageRef.trim()) {
      setError('Image reference is required')
      return
    }

    setPulling(true)
    setError(null)

    try {
      await pullImage(imageRef.trim())
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image')
    } finally {
      setPulling(false)
    }
  }

  // 진행률: 서비스 레이어에서 계산된 percent 사용
  const progressPercent = progress?.percent ?? 0
  // resolving/verifying 단계는 진행률이 불확실하므로 indeterminate 애니메이션 적용
  const isIndeterminate = progress?.phase === 'resolving' || progress?.phase === 'verifying'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Pull Image
          </DialogTitle>
          <DialogDescription>
            Enter the image reference to pull from a registry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-ref">Image Reference</Label>
            <Input
              id="image-ref"
              placeholder="nginx:latest, ghcr.io/user/repo:tag"
              value={imageRef}
              onChange={(e) => setImageRef(e.target.value)}
              disabled={pulling}
            />
            <p className="text-xs text-muted-foreground">
              Examples: nginx:latest, postgres:16, ghcr.io/owner/repo:tag
            </p>
          </div>

          {/* 진행 상황 */}
          {pulling && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress?.message ?? 'Pulling image…'}
                </span>
                {progress && <span className="font-mono">{progressPercent}%</span>}
              </div>
              {/* progress 없으면 indeterminate, resolving/verifying도 indeterminate */}
              <div className={(!progress || isIndeterminate) ? 'animate-pulse' : undefined}>
                <Progress value={progress ? progressPercent : undefined} />
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pulling}>
            Cancel
          </Button>
          <Button onClick={handlePull} disabled={pulling || !imageRef.trim()}>
            {pulling ? 'Pulling...' : 'Pull'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
