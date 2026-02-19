import { create } from 'zustand'

export type ActiveView = 'dashboard' | 'containers' | 'images' | 'volumes' | 'networks' | 'settings'
export type DetailTab = 'logs' | 'stats' | 'shell' | 'inspect'

interface UIState {
  // 현재 활성화된 뷰
  activeView: ActiveView
  // 사이드바 접힘 상태
  sidebarCollapsed: boolean
  // 선택된 컨테이너 ID
  selectedContainerId: string | null
  // 상세 패널 탭
  activeDetailTab: DetailTab
  // 상세 패널 표시 여부
  detailPanelVisible: boolean
  // Command Palette 열림 상태
  commandPaletteOpen: boolean
  // 검색 쿼리
  searchQuery: string
}

interface UIActions {
  setActiveView: (view: ActiveView) => void
  setSelectedContainer: (id: string | null) => void
  setActiveDetailTab: (tab: DetailTab) => void
  toggleSidebar: () => void
  toggleDetailPanel: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  reset: () => void
}

const initialState: UIState = {
  activeView: 'dashboard',
  sidebarCollapsed: false,
  selectedContainerId: null,
  activeDetailTab: 'logs',
  detailPanelVisible: false,
  commandPaletteOpen: false,
  searchQuery: ''
}

/**
 * UI 상태 관리 스토어
 * - 뷰 전환, 사이드바, 상세 패널 등 UI 상태 관리
 */
export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,

  setActiveView: (view) => set({ activeView: view }),

  setSelectedContainer: (id) =>
    set({
      selectedContainerId: id,
      detailPanelVisible: id !== null,
      activeDetailTab: 'logs'
    }),

  setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleDetailPanel: () => set((state) => ({ detailPanelVisible: !state.detailPanelVisible })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  reset: () => set(initialState)
}))
