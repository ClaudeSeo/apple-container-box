import { useEffect, useState, useCallback, useRef } from 'react'
import type { ContainerStats } from '@/types'

interface StatsDataPoint {
  timestamp: number
  cpuPercent: number
  memoryUsage: number
  memoryLimit: number
  networkRx: number
  networkTx: number
}

interface UseContainerStatsOptions {
  maxDataPoints?: number
  enabled?: boolean
}

interface UseContainerStatsResult {
  currentStats: ContainerStats | null
  history: StatsDataPoint[]
  isPolling: boolean
  startPolling: () => void
  stopPolling: () => void
}

/**
 * 컨테이너 Stats 스트리밍 훅
 * - 실시간 리소스 사용량 데이터
 * - 히스토리 데이터 (차트용)
 */
export function useContainerStats(
  containerId: string | null,
  options: UseContainerStatsOptions = {}
): UseContainerStatsResult {
  const { maxDataPoints = 60, enabled = true } = options

  const [currentStats, setCurrentStats] = useState<ContainerStats | null>(null)
  const [history, setHistory] = useState<StatsDataPoint[]>([])
  const isPollingRef = useRef(false)
  const [isPolling, setIsPolling] = useState(false)
  const prevNetworkRef = useRef<{ rx: number; tx: number } | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const startPolling = useCallback(() => {
    if (!containerId || isPollingRef.current) return

    unsubscribeRef.current = window.electronAPI.streams.onStats(containerId, (stats) => {
      const containerStats: ContainerStats = {
        containerId,
        cpuPercent: stats.cpuPercent,
        memoryUsage: stats.memoryUsage,
        memoryLimit: stats.memoryLimit,
        networkRx: stats.networkRx,
        networkTx: stats.networkTx,
        blockRead: 0,
        blockWrite: 0,
        timestamp: stats.timestamp
      }

      setCurrentStats(containerStats)

      let networkRxRate = 0
      let networkTxRate = 0
      if (prevNetworkRef.current) {
        networkRxRate = stats.networkRx - prevNetworkRef.current.rx
        networkTxRate = stats.networkTx - prevNetworkRef.current.tx
      }
      prevNetworkRef.current = { rx: stats.networkRx, tx: stats.networkTx }

      const dataPoint: StatsDataPoint = {
        timestamp: stats.timestamp,
        cpuPercent: stats.cpuPercent,
        memoryUsage: stats.memoryUsage,
        memoryLimit: stats.memoryLimit,
        networkRx: networkRxRate,
        networkTx: networkTxRate
      }

      setHistory((prev) => {
        const newHistory = [...prev, dataPoint]
        if (newHistory.length > maxDataPoints) {
          return newHistory.slice(-maxDataPoints)
        }
        return newHistory
      })
    })

    isPollingRef.current = true
    setIsPolling(true)
  }, [containerId, maxDataPoints])

  const stopPolling = useCallback(() => {
    if (!isPollingRef.current) return
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    isPollingRef.current = false
    setIsPolling(false)
  }, [])

  // 컨테이너 변경 시 폴링 시작/중지
  useEffect(() => {
    if (containerId && enabled) {
      setCurrentStats(null)
      setHistory([])
      prevNetworkRef.current = null
      startPolling()
    } else {
      setCurrentStats(null)
      setHistory([])
      prevNetworkRef.current = null
    }
    return () => {
      // stopPolling()은 isPolling 상태에 의존 → stale closure 방지를 위해 직접 cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      isPollingRef.current = false
      setIsPolling(false)
    }
  }, [containerId, enabled, startPolling])

  return {
    currentStats,
    history,
    isPolling,
    startPolling,
    stopPolling
  }
}

/**
 * 메모리 사용률 계산
 */
export function calculateMemoryPercent(usage: number, limit: number): number {
  if (limit === 0) return 0
  return (usage / limit) * 100
}
