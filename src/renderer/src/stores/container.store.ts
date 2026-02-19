import { create } from 'zustand'
import type { Container, ContainerStats } from '@/types'

interface ContainerState {
  // 컨테이너 목록
  containers: Container[]
  // 로딩 상태
  loading: boolean
  // 에러 상태
  error: string | null
  // 개별 컨테이너 stats 캐시
  statsCache: Record<string, ContainerStats>
  // 마지막 업데이트 시간
  lastUpdated: number | null
}

interface ContainerActions {
  setContainers: (containers: Container[]) => void
  updateContainer: (id: string, updates: Partial<Container>) => void
  removeContainer: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setStats: (id: string, stats: ContainerStats) => void
  clearStats: (id: string) => void
  reset: () => void
}

const initialState: ContainerState = {
  containers: [],
  loading: false,
  error: null,
  statsCache: {},
  lastUpdated: null
}

/**
 * 컨테이너 상태 관리 스토어
 * - 컨테이너 목록, stats 캐시 관리
 */
export const useContainerStore = create<ContainerState & ContainerActions>((set) => ({
  ...initialState,

  setContainers: (containers) =>
    set({
      containers,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    }),

  updateContainer: (id, updates) =>
    set((state) => ({
      containers: state.containers.map((c) => (c.id === id ? { ...c, ...updates } : c))
    })),

  removeContainer: (id) =>
    set((state) => ({
      containers: state.containers.filter((c) => c.id !== id),
      statsCache: Object.fromEntries(
        Object.entries(state.statsCache).filter(([key]) => key !== id)
      )
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setStats: (id, stats) =>
    set((state) => ({
      statsCache: { ...state.statsCache, [id]: stats }
    })),

  clearStats: (id) =>
    set((state) => ({
      statsCache: Object.fromEntries(
        Object.entries(state.statsCache).filter(([key]) => key !== id)
      )
    })),

  reset: () => set(initialState)
}))

/**
 * 컨테이너 목록 필터링 셀렉터
 */
export const selectFilteredContainers = (
  containers: Container[],
  searchQuery: string,
  statusFilter?: string
): Container[] => {
  let filtered = containers

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.image.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    )
  }

  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((c) => c.status === statusFilter)
  }

  return filtered
}

/**
 * 상태별 컨테이너 수 계산
 */
export const selectContainerStats = (
  containers: Container[]
): { total: number; running: number; stopped: number; paused: number } => {
  return containers.reduce(
    (acc, c) => {
      acc.total++
      if (c.status === 'running') acc.running++
      else if (c.status === 'paused') acc.paused++
      else acc.stopped++
      return acc
    },
    { total: 0, running: 0, stopped: 0, paused: 0 }
  )
}
