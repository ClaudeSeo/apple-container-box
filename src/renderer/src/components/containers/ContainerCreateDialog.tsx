import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useContainerActions } from '@/hooks/useContainers'
import { toast } from '@/hooks/use-toast'
import {
  buildContainerRunOptions,
  type EnvVarInput,
  type PortMappingInput,
  type VolumeMountInput
} from './container-create.validation'

interface ContainerCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 컨테이너 생성 다이얼로그
 */
export function ContainerCreateDialog({
  open,
  onOpenChange
}: ContainerCreateDialogProps): JSX.Element {
  const { createContainer, loading } = useContainerActions()

  // 폼 상태
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [ports, setPorts] = useState<PortMappingInput[]>([])
  const [envVars, setEnvVars] = useState<EnvVarInput[]>([])
  const [volumes, setVolumes] = useState<VolumeMountInput[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoStart, setAutoStart] = useState(true)

  const resetForm = (): void => {
    setImage('')
    setName('')
    setPorts([])
    setEnvVars([])
    setVolumes([])
    setShowAdvanced(false)
    setAutoStart(true)
  }

  const handleClose = (): void => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async (): Promise<void> => {
    const result = buildContainerRunOptions({
      image,
      name,
      ports,
      envVars,
      volumes,
      autoStart
    })

    if (!result.ok) {
      toast({
        title: result.error.title,
        description: result.error.description,
        variant: 'destructive'
      })
      return
    }

    try {
      await createContainer(result.options)
      handleClose()
    } catch {
      // 에러는 useContainerActions에서 처리
    }
  }

  // 포트 추가/제거
  const addPort = (): void => setPorts([...ports, { hostPort: '', containerPort: '' }])
  const removePort = (index: number): void => setPorts(ports.filter((_, i) => i !== index))
  const updatePort = (index: number, field: keyof PortMappingInput, value: string): void => {
    const newPorts = [...ports]
    newPorts[index][field] = value
    setPorts(newPorts)
  }

  // 환경변수 추가/제거
  const addEnvVar = (): void => setEnvVars([...envVars, { key: '', value: '' }])
  const removeEnvVar = (index: number): void => setEnvVars(envVars.filter((_, i) => i !== index))
  const updateEnvVar = (index: number, field: keyof EnvVarInput, value: string): void => {
    const newEnvVars = [...envVars]
    newEnvVars[index][field] = value
    setEnvVars(newEnvVars)
  }

  // 볼륨 추가/제거
  const addVolume = (): void => setVolumes([...volumes, { hostPath: '', containerPath: '' }])
  const removeVolume = (index: number): void => setVolumes(volumes.filter((_, i) => i !== index))
  const updateVolume = (index: number, field: keyof VolumeMountInput, value: string): void => {
    const newVolumes = [...volumes]
    newVolumes[index][field] = value
    setVolumes(newVolumes)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Container</DialogTitle>
          <DialogDescription>Run a new container from an image</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 이미지 */}
          <div className="space-y-2">
            <Label htmlFor="image">Image *</Label>
            <Input
              id="image"
              placeholder="nginx:latest"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">Container Name</Label>
            <Input
              id="name"
              placeholder="my-container (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 포트 매핑 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Port Mappings</Label>
              <Button variant="ghost" size="sm" onClick={addPort}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {ports.map((port, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Host"
                  value={port.hostPort}
                  onChange={(e) => updatePort(index, 'hostPort', e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  placeholder="Container"
                  value={port.containerPort}
                  onChange={(e) => updatePort(index, 'containerPort', e.target.value)}
                  className="w-24"
                />
                <Button variant="ghost" size="icon" onClick={() => removePort(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 환경변수 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environment Variables</Label>
              <Button variant="ghost" size="sm" onClick={addEnvVar}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {envVars.map((env, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                  className="w-32"
                />
                <span className="text-muted-foreground">=</span>
                <Input
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeEnvVar(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 고급 옵션 토글 */}
          <div className="flex items-center space-x-2">
            <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} id="advanced" />
            <Label htmlFor="advanced">Show advanced options</Label>
          </div>

          {/* 고급 옵션 */}
          {showAdvanced && (
            <div className="space-y-4 border-t border-border pt-4">
              {/* 볼륨 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Volume Mounts</Label>
                  <Button variant="ghost" size="sm" onClick={addVolume}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                {volumes.map((volume, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Host path"
                      value={volume.hostPath}
                      onChange={(e) => updateVolume(index, 'hostPath', e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      placeholder="Container path"
                      value={volume.containerPath}
                      onChange={(e) => updateVolume(index, 'containerPath', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeVolume(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 자동 시작 */}
              <div className="flex items-center space-x-2">
                <Switch checked={autoStart} onCheckedChange={setAutoStart} id="autoStart" />
                <Label htmlFor="autoStart">Start container after creation</Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!image.trim() || loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
