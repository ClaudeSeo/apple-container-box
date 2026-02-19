/**
 * 네트워크 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'
import type { Network } from '@/types'

interface UseNetworksReturn {
  networks: Network[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createNetwork: (name: string, driver?: string, subnet?: string) => Promise<Network>
  deleteNetwork: (id: string, force?: boolean) => Promise<void>
  inspectNetwork: (id: string) => Promise<Network>
}

export function useNetworks(): UseNetworksReturn {
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNetworks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.networks.list()
      setNetworks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch networks')
    } finally {
      setLoading(false)
    }
  }, [])

  const createNetwork = useCallback(async (name: string, driver?: string, subnet?: string) => {
    const network = await window.electronAPI.networks.create(name, driver, subnet)
    await fetchNetworks()
    return network
  }, [fetchNetworks])

  const deleteNetwork = useCallback(async (id: string, force?: boolean) => {
    await window.electronAPI.networks.remove(id, force)
    await fetchNetworks()
  }, [fetchNetworks])

  const inspectNetwork = useCallback(async (id: string) => {
    return window.electronAPI.networks.inspect(id)
  }, [])

  useEffect(() => {
    fetchNetworks()
  }, [fetchNetworks])

  return {
    networks,
    loading,
    error,
    refetch: fetchNetworks,
    createNetwork,
    deleteNetwork,
    inspectNetwork
  }
}
