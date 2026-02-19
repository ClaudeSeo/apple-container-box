/**
 * 앱 설정 영속성 스토어
 * electron-store 기반 로컬 저장소
 */

import Store from 'electron-store'
import { logger } from '../utils/logger'

const log = logger.scope('SettingsStore')

/** CLI 설정 */
export interface CLISettings {
  mode: 'auto' | 'custom'
  customPath?: string
  detectedPath?: string
  version?: string
}

/** 앱 설정 */
export interface AppSettings {
  autoLaunch: boolean
  showTrayIcon: boolean
  minimizeToTray: boolean
  cli: CLISettings
  refreshInterval: number
}

/** 기본 설정값 */
const DEFAULT_SETTINGS: AppSettings = {
  autoLaunch: false,
  showTrayIcon: true,
  minimizeToTray: true,
  cli: {
    mode: 'auto'
  },
  refreshInterval: 2000
}

const MIN_REFRESH_INTERVAL = 500
const MAX_REFRESH_INTERVAL = 10000

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
    const current = store.get('settings')
    const sanitized = sanitizeSettings(current)
    store.set('settings', sanitized)
    return sanitized
  },

  /** 설정 업데이트 (부분 업데이트 지원) */
  set(settings: Partial<AppSettings>): void {
    const current = this.get()
    const merged = deepMerge(current, settings)
    const sanitized = sanitizeSettings(merged)
    store.set('settings', sanitized)
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
    const settings = this.get()
    settings[key] = value
    store.set('settings', sanitizeSettings(settings))
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
  const result = { ...target } as Record<string, unknown>
  const sourceObject = source as Record<string, unknown>

  for (const [key, sourceValue] of Object.entries(sourceObject)) {
    if (sourceValue === undefined) continue

    const targetValue = result[key]
    if (Array.isArray(sourceValue)) {
      result[key] = [...sourceValue]
      continue
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      )
      continue
    }

    result[key] = sourceValue
  }

  return result as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export default settingsStore

function sanitizeSettings(raw: AppSettings): AppSettings {
  const source = raw as Partial<AppSettings>
  const cli = source.cli ?? { mode: 'auto' }
  const refreshValue = typeof source.refreshInterval === 'number' ? source.refreshInterval : NaN

  const refreshInterval =
    Number.isFinite(refreshValue) &&
    refreshValue >= MIN_REFRESH_INTERVAL &&
    refreshValue <= MAX_REFRESH_INTERVAL
      ? refreshValue
      : DEFAULT_SETTINGS.refreshInterval

  const customPath = cli.customPath?.trim()

  return {
    autoLaunch: Boolean(source.autoLaunch),
    showTrayIcon: Boolean(source.showTrayIcon),
    minimizeToTray: Boolean(source.minimizeToTray),
    cli: {
      mode: customPath ? 'custom' : 'auto',
      customPath: customPath ? customPath : undefined
    },
    refreshInterval
  }
}
