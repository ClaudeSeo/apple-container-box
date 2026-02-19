/**
 * 앱 설정 관련 타입 정의
 */

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

export interface AppSettings {
  /** 로그인 시 자동 시작 */
  autoLaunch: boolean
  /** 시스템 트레이 아이콘 표시 */
  showTrayIcon: boolean
  /** 닫기 시 트레이로 최소화 */
  minimizeToTray: boolean
  /** CLI 설정 */
  cli: CLISettings
  /** 컨테이너 자동 새로고침 간격 (ms), 0이면 비활성화 */
  refreshInterval: number
}

/** 기본 설정값 */
export const DEFAULT_SETTINGS: AppSettings = {
  autoLaunch: false,
  showTrayIcon: true,
  minimizeToTray: true,
  cli: {
    mode: 'auto'
  },
  refreshInterval: 2000
}
