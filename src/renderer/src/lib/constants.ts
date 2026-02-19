/**
 * 앱 라우트 정의
 */
export const ROUTES = {
  DASHBOARD: 'dashboard',
  CONTAINERS: 'containers',
  IMAGES: 'images',
  VOLUMES: 'volumes',
  NETWORKS: 'networks',
  SETTINGS: 'settings'
} as const

export type RouteKey = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * 사이드바 네비게이션 아이템
 */
export const NAV_ITEMS = [
  { id: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: ROUTES.CONTAINERS, label: 'Containers', icon: 'Box' },
  { id: ROUTES.IMAGES, label: 'Images', icon: 'Layers' },
  { id: ROUTES.VOLUMES, label: 'Volumes', icon: 'HardDrive' },
  { id: ROUTES.NETWORKS, label: 'Networks', icon: 'Network' },
  { id: ROUTES.SETTINGS, label: 'Settings', icon: 'Settings' }
] as const

/**
 * 컨테이너 상태별 컬러 맵핑
 */
export const STATUS_COLORS = {
  running: {
    bg: 'bg-status-running/20',
    text: 'text-status-running',
    border: 'border-status-running',
    dot: 'bg-status-running'
  },
  stopped: {
    bg: 'bg-status-stopped/20',
    text: 'text-status-stopped',
    border: 'border-status-stopped',
    dot: 'bg-status-stopped'
  },
  paused: {
    bg: 'bg-status-paused/20',
    text: 'text-status-paused',
    border: 'border-status-paused',
    dot: 'bg-status-paused'
  },
  restarting: {
    bg: 'bg-status-restarting/20',
    text: 'text-status-restarting',
    border: 'border-status-restarting',
    dot: 'bg-status-restarting'
  },
  error: {
    bg: 'bg-status-error/20',
    text: 'text-status-error',
    border: 'border-status-error',
    dot: 'bg-status-error'
  },
  created: {
    bg: 'bg-status-stopped/20',
    text: 'text-status-stopped',
    border: 'border-status-stopped',
    dot: 'bg-status-stopped'
  },
  exited: {
    bg: 'bg-status-stopped/20',
    text: 'text-status-stopped',
    border: 'border-status-stopped',
    dot: 'bg-status-stopped'
  },
  removing: {
    bg: 'bg-status-error/20',
    text: 'text-status-error',
    border: 'border-status-error',
    dot: 'bg-status-error'
  },
  dead: {
    bg: 'bg-status-error/20',
    text: 'text-status-error',
    border: 'border-status-error',
    dot: 'bg-status-error'
  }
} as const

export type ContainerStatusKey = keyof typeof STATUS_COLORS

/**
 * 키보드 단축키 정의
 */
export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: { key: 'k', modifiers: ['meta'] },
  REFRESH: { key: 'r', modifiers: ['meta'] },
  NEW_CONTAINER: { key: 'n', modifiers: ['meta'] },
  SEARCH: { key: 'f', modifiers: ['meta'] },
  SETTINGS: { key: ',', modifiers: ['meta'] },
  CLOSE_PANEL: { key: 'Escape', modifiers: [] }
} as const

/**
 * 폴링 간격 (ms)
 */
export const POLLING_INTERVALS = {
  CONTAINER_LIST: 5000,
  CONTAINER_STATS: 2000,
  LOGS: 1000,
  SYSTEM_INFO: 10000
} as const

/**
 * 로그 관련 상수
 */
export const LOG_CONFIG = {
  MAX_LINES: 1000,
  TAIL_LINES: 100,
  BUFFER_SIZE: 500
} as const

/**
 * 토스트 지속 시간 (ms)
 */
export const TOAST_DURATION = {
  DEFAULT: 3000,
  SUCCESS: 2000,
  ERROR: 5000
} as const

/**
 * 애니메이션 지속 시간 (ms)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const
