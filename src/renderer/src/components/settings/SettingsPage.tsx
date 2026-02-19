/**
 * 설정 페이지
 */

import { useState, useEffect } from 'react'
import { Settings, Terminal, RefreshCw, RotateCcw, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings, useCLIStatus } from '@/hooks/useSettings'
import type { AppSettings } from '@/types'

export function SettingsPage() {
  const { settings, loading, updateSettings, resetSettings } = useSettings()
  const { status: cliStatus, loading: cliLoading, refetch: recheckCLI } = useCLIStatus()

  // 로컬 상태 (저장 전 편집용)
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // settings가 로드되면 로컬 상태에 복사
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleSave = async () => {
    if (!localSettings) return
    setSaving(true)
    try {
      await updateSettings(localSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    await resetSettings()
  }

  const updateLocal = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  const updateLocalNested = <K extends keyof AppSettings>(
    key: K,
    nestedKey: string,
    value: unknown
  ) => {
    setLocalSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [key]: {
          ...(prev[key] as object),
          [nestedKey]: value
        }
      }
    })
  }

  if (loading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8 max-w-5xl">
          {/* General */}
          <section className="space-y-4 bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              General
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-launch">Auto Launch</Label>
                  <p className="text-xs text-muted-foreground">Start application on system login</p>
                </div>
                <Switch
                  id="auto-launch"
                  checked={localSettings.autoLaunch}
                  onCheckedChange={(checked) => updateLocal('autoLaunch', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-tray">Show Tray Icon</Label>
                  <p className="text-xs text-muted-foreground">
                    Display icon in system tray/menu bar
                  </p>
                </div>
                <Switch
                  id="show-tray"
                  checked={localSettings.showTrayIcon}
                  onCheckedChange={(checked) => updateLocal('showTrayIcon', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimize-tray">Minimize to Tray</Label>
                  <p className="text-xs text-muted-foreground">
                    Minimize to tray instead of closing
                  </p>
                </div>
                <Switch
                  id="minimize-tray"
                  checked={localSettings.minimizeToTray}
                  onCheckedChange={(checked) => updateLocal('minimizeToTray', checked)}
                />
              </div>
            </div>
          </section>

          {/* CLI Settings */}
          <section className="space-y-4 bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Apple Container CLI
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0c10] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <span
                    className={`text-sm ${
                      cliStatus?.available ? 'text-status-running' : 'text-status-error'
                    }`}
                  >
                    {cliLoading
                      ? 'Checking...'
                      : cliStatus?.available
                        ? cliStatus.isMock
                          ? 'Mock Mode'
                          : 'Connected'
                        : 'Not Found'}
                  </span>
                </div>
                {cliStatus?.path && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Version</span>
                    <span className="ml-4 text-right text-sm text-muted-foreground font-mono break-all">
                      {cliStatus.path}
                    </span>
                  </div>
                )}
                {cliStatus?.error && <p className="text-sm text-destructive">{cliStatus.error}</p>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={recheckCLI}
                  disabled={cliLoading}
                  className="w-full mt-2"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${cliLoading ? 'animate-spin' : ''}`} />
                  Re-detect CLI
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cli-path">Custom CLI Path (optional)</Label>
                <Input
                  id="cli-path"
                  placeholder="/usr/local/bin/container"
                  value={localSettings.cli.customPath || ''}
                  onChange={(e) =>
                    updateLocalNested('cli', 'customPath', e.target.value || undefined)
                  }
                />
                <p className="text-xs text-muted-foreground">Leave empty for auto-detection</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Refresh Interval (ms)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  min={500}
                  max={10000}
                  step={500}
                  value={localSettings.refreshInterval}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    updateLocal('refreshInterval', Number.isFinite(value) ? value : 2000)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Container list polling interval (500-10000ms)
                </p>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
