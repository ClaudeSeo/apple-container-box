import { create } from 'zustand'
import type { AppSettings } from '@/types'

interface SettingsState {
  // 앱 설정
  settings: AppSettings | null
  // 로딩 상태
  loading: boolean
  // 저장 중 상태
  saving: boolean
  // 에러 상태
  error: string | null
}

interface SettingsActions {
  setSettings: (settings: AppSettings) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  saving: false,
  error: null
}

/**
 * 설정 상태 관리 스토어
 * - 앱 설정 캐시 및 업데이트 관리
 */
export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  ...initialState,

  setSettings: (settings) =>
    set({
      settings,
      loading: false,
      error: null
    }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updates } : null
    })),

  setLoading: (loading) => set({ loading }),

  setSaving: (saving) => set({ saving }),

  setError: (error) => set({ error, loading: false, saving: false }),

  reset: () => set(initialState)
}))
