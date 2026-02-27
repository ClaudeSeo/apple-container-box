import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Terminal, RefreshCw, RotateCcw, Save, Check, Shield, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings, useCLIStatus } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import type { AppSettings } from '@/types'

/**
 * 설정 페이지 (Apple Style Redesign)
 */
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
      <div className="flex items-center justify-center h-full bg-[#000000]/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A84FF] border-t-transparent" />
          <p className="text-sm font-medium text-[#8E8E93]">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#000000]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8E8E93] text-white shadow-lg">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
            <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest mt-0.5">
              Preferences & Configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore Defaults
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={saving}
            className={cn(
                "min-w-[100px] transition-all duration-300 shadow-lg",
                saved ? "bg-[#30D158] hover:bg-[#30D158]/90 shadow-[#30D158]/20" : "bg-[#0A84FF] hover:bg-[#0A84FF]/90 shadow-[#0A84FF]/20"
            )}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-8 pb-8">
        <div className="max-w-4xl space-y-8">
          {/* General Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Shield className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Application Behavior
                </h3>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl overflow-hidden divide-y divide-white/5">
              <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-launch" className="text-sm font-semibold text-white">Auto Launch</Label>
                  <p className="text-xs text-[#8E8E93]">Start application automatically on system login</p>
                </div>
                <Switch
                  id="auto-launch"
                  checked={localSettings.autoLaunch}
                  onCheckedChange={(checked) => updateLocal('autoLaunch', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="show-tray" className="text-sm font-semibold text-white">Menu Bar Icon</Label>
                  <p className="text-xs text-[#8E8E93]">Show a status icon in the macOS menu bar</p>
                </div>
                <Switch
                  id="show-tray"
                  checked={localSettings.showTrayIcon}
                  onCheckedChange={(checked) => updateLocal('showTrayIcon', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="minimize-tray" className="text-sm font-semibold text-white">Minimize to Menu Bar</Label>
                  <p className="text-xs text-[#8E8E93]">Keep running in the background when window is closed</p>
                </div>
                <Switch
                  id="minimize-tray"
                  checked={localSettings.minimizeToTray}
                  onCheckedChange={(checked) => updateLocal('minimizeToTray', checked)}
                />
              </div>
            </div>
          </section>

          {/* CLI & Core Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Terminal className="w-4 h-4 text-[#BF5AF2]" />
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Engine & CLI Configuration
                </h3>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl overflow-hidden p-6 space-y-6">
                {/* CLI Status Info */}
                <div className="bg-black/40 rounded-xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                cliStatus?.available ? "bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.5)]" : "bg-[#FF453A]"
                            )} />
                            <span className="text-sm font-bold text-white">CLI Connection</span>
                        </div>
                        <span className={cn(
                            "text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                            cliStatus?.available ? "bg-[#30D158]/10 text-[#30D158]" : "bg-[#FF453A]/10 text-[#FF453A]"
                        )}>
                            {cliLoading ? 'Detecting...' : cliStatus?.available ? (cliStatus.isMock ? 'Mock Mode' : 'Active') : 'Unavailable'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-[#48484A] uppercase tracking-wider">Version</p>
                            <p className="text-sm font-mono text-[#E5E5E7]">{cliStatus?.version || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-bold text-[#48484A] uppercase tracking-wider">Refresh Rate</p>
                            <p className="text-sm font-mono text-[#E5E5E7]">{localSettings.refreshInterval}ms</p>
                        </div>
                    </div>

                    {cliStatus?.path && (
                        <div className="space-y-1 pt-2 border-t border-white/5">
                             <p className="text-[10px] font-bold text-[#48484A] uppercase tracking-wider">Executable Path</p>
                             <p className="text-xs font-mono text-[#8E8E93] break-all">{cliStatus.path}</p>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={recheckCLI}
                        disabled={cliLoading}
                        className="w-full mt-2 h-9 text-[#8E8E93] hover:text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", cliLoading && "animate-spin")} />
                        Re-scan Environment
                    </Button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cli-path" className="text-sm font-semibold text-white">Custom Executable Path</Label>
                        <Input
                            id="cli-path"
                            placeholder="/usr/local/bin/container"
                            value={localSettings.cli.customPath || ''}
                            onChange={(e) => updateLocalNested('cli', 'customPath', e.target.value || undefined)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-[#48484A] focus-visible:ring-[#0A84FF]/50"
                        />
                        <p className="text-[11px] text-[#8E8E93]">Specify a path if the CLI is not in your system PATH.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="refresh-interval" className="text-sm font-semibold text-white">Monitoring Refresh Interval</Label>
                        <div className="flex items-center gap-4">
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
                                className="w-32 bg-white/5 border-white/10 text-white focus-visible:ring-[#0A84FF]/50"
                            />
                            <div className="flex-1">
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#0A84FF] transition-all duration-300" 
                                        style={{ width: `${Math.min(100, Math.max(0, (localSettings.refreshInterval - 500) / 9500 * 100))}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-[#48484A] font-bold">
                                    <span>FAST (500ms)</span>
                                    <span>ECONOMY (10s)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* Footer Info */}
          <div className="pt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                        <Cpu className="h-3.5 w-3.5 text-[#8E8E93]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#48484A] tracking-widest uppercase">
                        Apple Container Box v0.0.1
                    </span>
                </div>
                <p className="text-[10px] text-[#48484A]">Designed for macOS with ❤️</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
