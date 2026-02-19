import { useEffect, useCallback, useState } from 'react'
import { useContainerStore, useUIStore, selectFilteredContainers } from '@/stores'
import { toast } from './use-toast'
import type { ContainerRunOptions } from '@/types'

const DEFAULT_REFRESH_INTERVAL = 2000
const MIN_REFRESH_INTERVAL = 500
const MAX_REFRESH_INTERVAL = 10000

function sanitizeRefreshInterval(interval: number): number {
  if (!Number.isFinite(interval)) {
    return DEFAULT_REFRESH_INTERVAL
  }

  if (interval < MIN_REFRESH_INTERVAL || interval > MAX_REFRESH_INTERVAL) {
    return DEFAULT_REFRESH_INTERVAL
  }

  return interval
}

/**
 * 컨테이너 목록 관리 훅
 * - 폴링으로 자동 업데이트
 * - 필터링 지원
 */
export function useContainers() {
  const { containers, setContainers, setLoading, setError } = useContainerStore()
  const { searchQuery } = useUIStore()
  const [loading, setLocalLoading] = useState(true)
  const [error, setLocalError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(DEFAULT_REFRESH_INTERVAL)

  const fetchContainers = useCallback(async () => {
    try {
      const data = await window.electronAPI.containers.list({ all: true })
      setContainers(data)
      setLocalError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch containers'
      setLocalError(message)
      setError(message)
    } finally {
      setLocalLoading(false)
    }
  }, [setContainers, setError])

  // 초기 로드 및 폴링
  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchContainers, refreshInterval])

  useEffect(() => {
    let active = true

    const initializeSettings = async () => {
      try {
        const settings = await window.electronAPI.settings.get()
        if (active) {
          setRefreshInterval(sanitizeRefreshInterval(settings.refreshInterval))
        }
      } catch {
        if (active) {
          setRefreshInterval(DEFAULT_REFRESH_INTERVAL)
        }
      }
    }

    void initializeSettings()

    const unsubscribeSettings = window.electronAPI.settings.onChanged((settings) => {
      setRefreshInterval(sanitizeRefreshInterval(settings.refreshInterval))
    })

    const unsubscribeTray = window.electronAPI.tray.onRefreshContainers(() => {
      void fetchContainers()
    })

    return () => {
      active = false
      unsubscribeSettings()
      unsubscribeTray()
    }
  }, [fetchContainers])

  useEffect(() => {
    setLoading(loading)
  }, [loading, setLoading])

  // 필터링된 컨테이너 목록
  const filteredContainers = selectFilteredContainers(containers, searchQuery)

  return {
    containers: filteredContainers,
    allContainers: containers,
    loading,
    error,
    refetch: fetchContainers
  }
}

/**
 * 컨테이너 액션 훅
 * - start, stop, restart, remove 등
 */
export function useContainerActions() {
  const { updateContainer, removeContainer: removeFromStore } = useContainerStore()
  const { setSelectedContainer } = useUIStore()
  const [loading, setLoading] = useState(false)

  const startContainer = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        await window.electronAPI.containers.start(id)
        updateContainer(id, { status: 'running' })
        toast({ title: 'Container started', variant: 'default' })
      } catch (err) {
        toast({
          title: 'Failed to start container',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [updateContainer]
  )

  const stopContainer = useCallback(
    async (id: string, timeout?: number) => {
      setLoading(true)
      try {
        await window.electronAPI.containers.stop(id, timeout)
        updateContainer(id, { status: 'stopped' })
        toast({ title: 'Container stopped', variant: 'default' })
      } catch (err) {
        toast({
          title: 'Failed to stop container',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [updateContainer]
  )

  const restartContainer = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        updateContainer(id, { status: 'restarting' })
        await window.electronAPI.containers.restart(id)
        updateContainer(id, { status: 'running' })
        toast({ title: 'Container restarted', variant: 'default' })
      } catch (err) {
        toast({
          title: 'Failed to restart container',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [updateContainer]
  )

  const removeContainer = useCallback(
    async (id: string, force?: boolean) => {
      setLoading(true)
      try {
        await window.electronAPI.containers.remove(id, force)
        removeFromStore(id)
        setSelectedContainer(null)
        toast({ title: 'Container removed', variant: 'default' })
      } catch (err) {
        toast({
          title: 'Failed to remove container',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [removeFromStore, setSelectedContainer]
  )

  const createContainer = useCallback(async (options: ContainerRunOptions) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.containers.run(options)
      toast({
        title: 'Container created',
        description: `ID: ${result.id.slice(0, 12)}`,
        variant: 'default'
      })
      return result.id
    } catch (err) {
      toast({
        title: 'Failed to create container',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    startContainer,
    stopContainer,
    restartContainer,
    removeContainer,
    createContainer,
    loading
  }
}
