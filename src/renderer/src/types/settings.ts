/**
 * 앱 설정 관련 타입 정의
 */

export type ThemeMode = 'dark' | 'light' | 'system'

export interface NotificationSettings {
  /** 알림 활성화 */
  enabled: boolean
  /** 컨테이너 상태 변경 알림 */
  onStatusChange: boolean
  /** 이미지 풀 완료 알림 */
  onImagePull: boolean
  /** 에러 발생 알림 */
  onError: boolean
}

export interface CLISettings {
  /** CLI 경로 설정 모드 */
  mode: 'auto' | 'custom'
  /** 사용자 지정 CLI 경로 */
  customPath?: string
  /** 감지된 CLI 경로 (읽기 전용) */
  detectedPath?: string
  /** CLI 버전 (읽기 전용) */
  version?: string
}

export interface DisplaySettings {
  /** 테마 모드 */
  theme: ThemeMode
  /** 사이드바 너비 (픽셀) */
  sidebarWidth: number
  /** 상세 패널 너비 (픽셀) */
  detailPanelWidth: number
  /** 컴팩트 모드 */
  compactMode: boolean
}

export interface AppSettings {
  /** 로그인 시 자동 시작 */
  autoLaunch: boolean
  /** 시스템 트레이 아이콘 표시 */
  showTrayIcon: boolean
  /** 닫기 시 트레이로 최소화 */
  minimizeToTray: boolean
  /** 알림 설정 */
  notifications: NotificationSettings
  /** CLI 설정 */
  cli: CLISettings
  /** 화면 표시 설정 */
  display: DisplaySettings
  /** 컨테이너 자동 새로고침 간격 (ms), 0이면 비활성화 */
  refreshInterval: number
}

/** 기본 설정값 */
export const DEFAULT_SETTINGS: AppSettings = {
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
