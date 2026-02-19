/**
 * 설정 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@/types'

interface UseSettingsReturn {
  settings: AppSettings | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.settings.get()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    await window.electronAPI.settings.set(newSettings)
    await fetchSettings()
  }, [fetchSettings])

  const resetSettings = useCallback(async () => {
    const defaultSettings = await window.electronAPI.settings.reset()
    setSettings(defaultSettings)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
    resetSettings
  }
}

interface CLIStatus {
  available: boolean
  path?: string
  error?: string
  isMock?: boolean
}

/** CLI 상태 훅 */
export function useCLIStatus() {
  const [status, setStatus] = useState<CLIStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkCLI = useCallback(async () => {
    setLoading(true)
    try {
      const available = await window.electronAPI.system.checkCLI()
      setStatus({ available })
    } catch {
      setStatus({ available: false, error: 'Failed to check CLI' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkCLI()

    const unsubscribe = window.electronAPI.system.onCLIStatus((data) => {
      setStatus({
        available: data.connected,
        path: data.path,
        error: data.error
      })
    })

    return unsubscribe
  }, [checkCLI])

  return { status, loading, refetch: checkCLI }
}
