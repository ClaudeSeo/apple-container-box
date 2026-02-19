/**
 * 앱 상수 정의
 */

/** 앱 기본 정보 */
export const APP_NAME = 'apple-container-box'
export const APP_DISPLAY_NAME = 'Apple Container Box'

/** CLI 바이너리 */
export const CLI_BINARY = 'container'
export const CLI_DEFAULT_PATHS = ['/usr/local/bin/container', '/opt/homebrew/bin/container']

/** 폴링 간격 (ms) */
export const POLLING_INTERVAL_CONTAINER = 2000
export const POLLING_INTERVAL_STATS = 1000
export const POLLING_INTERVAL_SYSTEM = 5000

/** 버퍼 제한 */
export const LOG_BUFFER_MAX_LINES = 10000
export const STATS_HISTORY_MAX_POINTS = 60

/** CLI 타임아웃 (ms) */
export const CLI_TIMEOUT_DEFAULT = 30000
export const CLI_TIMEOUT_LONG = 120000

/** 윈도우 크기 */
export const WINDOW_DEFAULT_WIDTH = 1440
export const WINDOW_DEFAULT_HEIGHT = 900
export const WINDOW_MIN_WIDTH = 1024
export const WINDOW_MIN_HEIGHT = 640

/** IPC 채널명 프리픽스 */
export const IPC_CHANNEL_PREFIX = {
  CONTAINER: 'container:',
  IMAGE: 'image:',
  VOLUME: 'volume:',
  NETWORK: 'network:',
  SYSTEM: 'system:',
  SETTINGS: 'settings:',
  WINDOW: 'window:'
} as const

/** 스토어 키 */
export const STORE_KEY = {
  SETTINGS: 'settings',
  WINDOW_BOUNDS: 'windowBounds',
  SIDEBAR_WIDTH: 'sidebarWidth',
  DETAIL_PANEL_WIDTH: 'detailPanelWidth'
} as const

/** 상태 색상 매핑 */
export const STATUS_COLORS = {
  running: '#4ade80',
  stopped: '#6b7280',
  error: '#ef4444',
  paused: '#f59e0b',
  restarting: '#3b82f6'
} as const
