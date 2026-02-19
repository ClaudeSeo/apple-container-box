/**
 * 설정 페이지
 */

import { useState, useEffect } from 'react'
import { Settings, Monitor, Bell, Terminal, RefreshCw, RotateCcw, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings, useCLIStatus } from '@/hooks/useSettings'
import type { AppSettings, ThemeMode } from '@/types'

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
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
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
        <div className="p-6 space-y-8 max-w-2xl">
          {/* General */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              General
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-launch">Auto Launch</Label>
                  <p className="text-sm text-muted-foreground">
                    Start application on system login
                  </p>
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
                  <p className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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

          <Separator />

          {/* Appearance */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup
                  value={localSettings.display.theme}
                  onValueChange={(value) =>
                    updateLocalNested('display', 'theme', value as ThemeMode)
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="font-normal">
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="font-normal">
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system" className="font-normal">
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use smaller UI elements</p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={localSettings.display.compactMode}
                  onCheckedChange={(checked) => updateLocalNested('display', 'compactMode', checked)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* CLI Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Apple Container CLI
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-lg space-y-2">
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
                    <span className="text-sm text-muted-foreground font-mono">{cliStatus.path}</span>
                  </div>
                )}
                {cliStatus?.error && (
                  <p className="text-sm text-destructive">{cliStatus.error}</p>
                )}
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
                  onChange={(e) => updateLocalNested('cli', 'customPath', e.target.value || undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for auto-detection
                </p>
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
                  onChange={(e) => updateLocal('refreshInterval', parseInt(e.target.value) || 2000)}
                />
                <p className="text-xs text-muted-foreground">
                  Container list polling interval (500-10000ms)
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Notifications */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={localSettings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    updateLocalNested('notifications', 'enabled', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-status">Status Change Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when container status changes
                  </p>
                </div>
                <Switch
                  id="notify-status"
                  checked={localSettings.notifications.onStatusChange}
                  onCheckedChange={(checked) =>
                    updateLocalNested('notifications', 'onStatusChange', checked)
                  }
                  disabled={!localSettings.notifications.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-pull">Image Pull Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when image pull completes
                  </p>
                </div>
                <Switch
                  id="notify-pull"
                  checked={localSettings.notifications.onImagePull}
                  onCheckedChange={(checked) =>
                    updateLocalNested('notifications', 'onImagePull', checked)
                  }
                  disabled={!localSettings.notifications.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-error">Error Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify on errors</p>
                </div>
                <Switch
                  id="notify-error"
                  checked={localSettings.notifications.onError}
                  onCheckedChange={(checked) =>
                    updateLocalNested('notifications', 'onError', checked)
                  }
                  disabled={!localSettings.notifications.enabled}
                />
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
