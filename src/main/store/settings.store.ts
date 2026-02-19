/**
 * 앱 설정 영속성 스토어
 * electron-store 기반 로컬 저장소
 */

import Store from 'electron-store'
import { logger } from '../utils/logger'

const log = logger.scope('SettingsStore')

/** 테마 모드 */
export type ThemeMode = 'dark' | 'light' | 'system'

/** 알림 설정 */
export interface NotificationSettings {
  enabled: boolean
  onStatusChange: boolean
  onImagePull: boolean
  onError: boolean
}

/** CLI 설정 */
export interface CLISettings {
  mode: 'auto' | 'custom'
  customPath?: string
  detectedPath?: string
  version?: string
}

/** 화면 표시 설정 */
export interface DisplaySettings {
  theme: ThemeMode
  sidebarWidth: number
  detailPanelWidth: number
  compactMode: boolean
}

/** 앱 설정 */
export interface AppSettings {
  autoLaunch: boolean
  showTrayIcon: boolean
  minimizeToTray: boolean
  notifications: NotificationSettings
  cli: CLISettings
  display: DisplaySettings
  refreshInterval: number
}

/** 기본 설정값 */
const DEFAULT_SETTINGS: AppSettings = {
  autoLaunch: false,
  showTrayIcon: true,
  minimizeToTray: true,
  notifications: {
    enabled: true,
    onStatusChange: true,
    onImagePull: true,
    onError: true
  },
  cli: {
    mode: 'auto'
  },
  display: {
    theme: 'dark',
    sidebarWidth: 240,
    detailPanelWidth: 400,
    compactMode: false
  },
  refreshInterval: 2000
}

/** 윈도우 bounds */
export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

/** 스토어 스키마 */
interface StoreSchema {
  settings: AppSettings
  windowBounds: WindowBounds
}

/** 기본 윈도우 bounds */
const DEFAULT_WINDOW_BOUNDS: WindowBounds = {
  width: 1440,
  height: 900,
  isMaximized: false
}

/**
 * electron-store v10 타입 호환 인터페이스
 */
interface TypedStore {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K]
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void
}

/** 스토어 인스턴스 */
const store = new Store({
  name: 'settings',
  defaults: {
    settings: DEFAULT_SETTINGS,
    windowBounds: DEFAULT_WINDOW_BOUNDS
  }
}) as unknown as TypedStore

/**
 * 설정 스토어 API
 */
export const settingsStore = {
  /** 전체 설정 가져오기 */
  get(): AppSettings {
    return store.get('settings')
  },

  /** 설정 업데이트 (부분 업데이트 지원) */
  set(settings: Partial<AppSettings>): void {
    const current = store.get('settings')
    const merged = deepMerge(current, settings)
    store.set('settings', merged)
    log.info('Settings updated', settings)
  },

  /** 설정 초기화 */
  reset(): AppSettings {
    store.set('settings', DEFAULT_SETTINGS)
    log.info('Settings reset to defaults')
    return DEFAULT_SETTINGS
  },

  /** 특정 키 가져오기 */
  getKey<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const settings = store.get('settings')
    return settings[key]
  },

  /** 특정 키 설정 */
  setKey<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const settings = store.get('settings')
    settings[key] = value
    store.set('settings', settings)
  },

  /** 윈도우 bounds 가져오기 */
  getWindowBounds(): WindowBounds {
    return store.get('windowBounds')
  },

  /** 윈도우 bounds 저장 */
  setWindowBounds(bounds: WindowBounds): void {
    store.set('windowBounds', bounds)
  }
}

/**
 * 깊은 병합 유틸리티
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue as object, sourceValue as object) as T[Extract<
        keyof T,
        string
      >]
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[Extract<keyof T, string>]
    }
  }
  return result
}

export default settingsStore
