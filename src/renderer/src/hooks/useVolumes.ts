/**
 * 볼륨 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'
import type { Volume } from '@/types'

interface UseVolumesReturn {
  volumes: Volume[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createVolume: (name: string, driver?: string) => Promise<Volume>
  deleteVolume: (name: string, force?: boolean) => Promise<void>
  inspectVolume: (name: string) => Promise<unknown>
}

export function useVolumes(): UseVolumesReturn {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVolumes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.volumes.list()
      setVolumes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volumes')
    } finally {
      setLoading(false)
    }
  }, [])

  const createVolume = useCallback(async (name: string, driver?: string) => {
    const volume = await window.electronAPI.volumes.create(name, driver)
    await fetchVolumes()
    return volume
  }, [fetchVolumes])

  const deleteVolume = useCallback(async (name: string, force?: boolean) => {
    await window.electronAPI.volumes.remove(name, force)
    await fetchVolumes()
  }, [fetchVolumes])

  const inspectVolume = useCallback(async (name: string) => {
    return window.electronAPI.volumes.inspect(name)
  }, [])

  useEffect(() => {
    fetchVolumes()
  }, [fetchVolumes])

  return {
    volumes,
    loading,
    error,
    refetch: fetchVolumes,
    createVolume,
    deleteVolume,
    inspectVolume
  }
}
