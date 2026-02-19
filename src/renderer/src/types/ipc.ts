/**
 * IPC 채널 타입 정의
 * Main Process ↔ Renderer 간 통신 계약
 */

import type {
  Container,
  ContainerStats,
  ContainerRunOptions,
  ContainerListOptions,
  ContainerLogsOptions
} from './container'
import type { Image, ImagePullOptions, ImagePullProgress, ImageBuildOptions } from './image'
import type { Volume, VolumeCreateOptions, VolumePruneResult } from './volume'
import type {
  Network,
  NetworkCreateOptions,
  NetworkConnectOptions,
  NetworkDisconnectOptions
} from './network'
import type { AppSettings } from './settings'

/** IPC invoke 채널 정의 (request-response) */
export interface IPCInvokeChannels {
  // Container
  'container:list': { args: ContainerListOptions; result: Container[] }
  'container:run': { args: ContainerRunOptions; result: { id: string } }
  'container:stop': { args: { id: string; timeout?: number }; result: void }
  'container:start': { args: { id: string }; result: void }
  'container:restart': { args: { id: string; timeout?: number }; result: void }
  'container:remove': { args: { id: string; force?: boolean }; result: void }
  'container:inspect': { args: { id: string }; result: Container }
  'container:logs': { args: ContainerLogsOptions; result: string }
  'container:exec': { args: { id: string; command: string[] }; result: { output: string } }

  // Image
  'image:list': { args: void; result: Image[] }
  'image:pull': { args: ImagePullOptions; result: void }
  'image:remove': { args: { id: string; force?: boolean }; result: void }
  'image:inspect': { args: { id: string }; result: unknown }
  'image:build': { args: ImageBuildOptions; result: { id: string } }

  // Volume
  'volume:list': { args: void; result: Volume[] }
  'volume:create': { args: VolumeCreateOptions; result: Volume }
  'volume:remove': { args: { name: string; force?: boolean }; result: void }
  'volume:inspect': { args: { name: string }; result: unknown }
  'volume:prune': { args: void; result: VolumePruneResult }

  // Network
  'network:list': { args: void; result: Network[] }
  'network:create': { args: NetworkCreateOptions; result: Network }
  'network:remove': { args: { id: string; force?: boolean }; result: void }
  'network:inspect': { args: { id: string }; result: Network }
  'network:connect': { args: NetworkConnectOptions; result: void }
  'network:disconnect': { args: NetworkDisconnectOptions; result: void }

  // System
  'system:info': { args: void; result: SystemInfo }
  'system:version': { args: void; result: CLIVersion }
  'system:prune': { args: { volumes?: boolean }; result: PruneResult }
  'system:resources': { args: void; result: SystemResources }

  // Settings
  'settings:get': { args: void; result: AppSettings }
  'settings:set': { args: Partial<AppSettings>; result: void }
  'settings:reset': { args: void; result: AppSettings }

  // Window
  'window:minimize': { args: void; result: void }
  'window:maximize': { args: void; result: void }
  'window:close': { args: void; result: void }
}

/** IPC on 채널 정의 (event subscription) */
export interface IPCOnChannels {
  'container:stats': ContainerStats
  'container:logs:stream': { containerId: string; line: string }
  'image:pull:progress': ImagePullProgress
  'notification': AppNotification
  'cli:status': CLIStatusEvent
}

/** 시스템 정보 */
export interface SystemInfo {
  /** OS 정보 */
  os: string
  /** 아키텍처 */
  arch: string
  /** 호스트명 */
  hostname: string
  /** 전체 메모리 (bytes) */
  totalMemory: number
  /** 가용 메모리 (bytes) */
  freeMemory: number
  /** CPU 코어 수 */
  cpuCount: number
  /** 실행 중인 컨테이너 수 */
  runningContainers: number
  /** 전체 컨테이너 수 */
  totalContainers: number
  /** 이미지 수 */
  imageCount: number
  /** 볼륨 수 */
  volumeCount: number
}

/** 시스템 실시간 리소스 정보 */
export interface SystemResources {
  /** CPU 사용률 (0-100%) */
  cpuUsage: number
  /** 사용 중인 메모리 (bytes) */
  memoryUsed: number
  /** 전체 메모리 (bytes) */
  memoryTotal: number
  /** 사용 중인 디스크 (bytes) */
  diskUsed: number
  /** 전체 디스크 (bytes) */
  diskTotal: number
}

/** CLI 버전 정보 */
export interface CLIVersion {
  /** CLI 버전 */
  version: string
  /** API 버전 */
  apiVersion?: string
  /** 빌드 정보 */
  buildInfo?: string
}

/** Prune 결과 */
export interface PruneResult {
  /** 삭제된 컨테이너 수 */
  containersDeleted: number
  /** 삭제된 이미지 수 */
  imagesDeleted: number
  /** 삭제된 볼륨 수 */
  volumesDeleted: number
  /** 회수된 공간 (bytes) */
  spaceReclaimed: number
}

/** 앱 알림 */
export interface AppNotification {
  /** 알림 타입 */
  type: 'info' | 'success' | 'warning' | 'error'
  /** 제목 */
  title: string
  /** 메시지 */
  message: string
  /** 타임스탬프 */
  timestamp: number
}

/** CLI 상태 이벤트 */
export interface CLIStatusEvent {
  /** 연결 상태 */
  connected: boolean
  /** CLI 경로 */
  path?: string
  /** 에러 메시지 */
  error?: string
}

/** IPC 결과 래퍼 (에러 처리용) */
export type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/** 타입 헬퍼: invoke 채널에서 args 타입 추출 */
export type IPCInvokeArgs<T extends keyof IPCInvokeChannels> = IPCInvokeChannels[T]['args']

/** 타입 헬퍼: invoke 채널에서 result 타입 추출 */
export type IPCInvokeResult<T extends keyof IPCInvokeChannels> = IPCInvokeChannels[T]['result']
