/**
 * Window 객체 타입 확장
 * Renderer에서 electronAPI 타입 지원
 */

import type {
  Container,
  ContainerStats,
  ContainerRunOptions,
  ContainerListOptions,
  Image,
  ImagePullProgress,
  ImageBuildOptions,
  Volume,
  VolumeCreateOptions,
  VolumePruneResult,
  Network,
  NetworkCreateOptions,
  NetworkConnectOptions,
  NetworkDisconnectOptions,
  AppSettings,
  SystemInfo,
  SystemResources,
  CLIVersion,
  PruneResult,
  AppNotification,
  CLIStatusEvent
} from '../renderer/src/types'

/** 구독 해제 함수 */
type Unsubscribe = () => void

/** Container API */
interface ContainerAPI {
  list(options?: ContainerListOptions): Promise<Container[]>
  run(options: ContainerRunOptions): Promise<{ id: string }>
  stop(id: string, timeout?: number): Promise<void>
  start(id: string): Promise<void>
  restart(id: string, timeout?: number): Promise<void>
  remove(id: string, force?: boolean): Promise<void>
  inspect(id: string): Promise<Container>
  logs(id: string, options?: { tail?: number; timestamps?: boolean }): Promise<string>
  exec(id: string, command: string[]): Promise<{ output: string }>
}

/** Image API */
interface ImageAPI {
  list(): Promise<Image[]>
  pull(image: string): Promise<void>
  remove(id: string, force?: boolean): Promise<void>
  inspect(id: string): Promise<unknown>
  build(options: ImageBuildOptions): Promise<{ id: string }>
}

/** Volume API */
interface VolumeAPI {
  list(): Promise<Volume[]>
  create(name: string, driver?: string): Promise<Volume>
  remove(name: string, force?: boolean): Promise<void>
  inspect(name: string): Promise<unknown>
  prune(): Promise<VolumePruneResult>
}

/** Network API */
interface NetworkAPI {
  list(): Promise<Network[]>
  create(name: string, driver?: string, subnet?: string): Promise<Network>
  remove(id: string, force?: boolean): Promise<void>
  inspect(id: string): Promise<Network>
  connect(
    network: string,
    container: string,
    options?: { ip?: string; alias?: string[] }
  ): Promise<void>
  disconnect(network: string, container: string, force?: boolean): Promise<void>
}

/** Streams API */
interface StreamsAPI {
  onLogs(containerId: string, callback: (data: { line: string }) => void): Unsubscribe
  onStats(
    containerId: string,
    callback: (data: {
      cpuPercent: number
      memoryUsage: number
      memoryLimit: number
      networkRx: number
      networkTx: number
      timestamp: number
    }) => void
  ): Unsubscribe
  onExec(sessionId: string, callback: (data: { output: string }) => void): Unsubscribe
  sendExecInput(sessionId: string, data: string): void
  onPullProgress(
    callback: (data: { image: string; status: string; current?: number; total?: number }) => void
  ): Unsubscribe
  startExec(containerId: string, command: string[]): Promise<{ sessionId: string }>
}

/** System API */
interface SystemAPI {
  checkCLI(): Promise<{ available: boolean; path?: string; version?: string; error?: string }>
  getInfo(): Promise<SystemInfo>
  getVersion(): Promise<CLIVersion>
  prune(options?: { volumes?: boolean }): Promise<PruneResult>
  getResources(): Promise<SystemResources>
  onCLIStatus(callback: (data: CLIStatusEvent) => void): Unsubscribe
}

/** Settings API */
interface SettingsAPI {
  get(): Promise<AppSettings>
  set(settings: Partial<AppSettings>): Promise<AppSettings>
  reset(): Promise<AppSettings>
  onChanged(callback: (settings: AppSettings) => void): Unsubscribe
}

interface TrayAPI {
  onRefreshContainers(callback: () => void): Unsubscribe
}

/** Window API */
interface WindowAPI {
  minimize(): Promise<void>
  maximize(): Promise<void>
  close(): Promise<void>
  isMaximized(): Promise<boolean>
  onStateChange(callback: (data: { maximized: boolean }) => void): Unsubscribe
}

/** Notification API */
interface NotificationAPI {
  onNotification(callback: (data: AppNotification) => void): Unsubscribe
}

/** Electron API (Main World에 노출) */
interface ElectronAPI {
  containers: ContainerAPI
  images: ImageAPI
  volumes: VolumeAPI
  networks: NetworkAPI
  streams: StreamsAPI
  system: SystemAPI
  settings: SettingsAPI
  tray: TrayAPI
  window: WindowAPI
  notifications: NotificationAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
