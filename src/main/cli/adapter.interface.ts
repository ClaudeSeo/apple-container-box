/**
 * Container CLI 어댑터 인터페이스
 * Real CLI와 Mock CLI가 공통으로 구현
 */

import type { ChildProcess } from 'child_process'

/** Container 타입 (Main Process 전용 간소화 버전) */
export interface CLIContainer {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'error' | 'paused' | 'restarting'
  createdAt: string
  ports: Array<{
    hostPort: number
    containerPort: number
    protocol: 'tcp' | 'udp'
  }>
  mounts: Array<{
    type: 'bind' | 'volume'
    source: string
    target: string
    readonly: boolean
  }>
  env: Record<string, string>
  labels: Record<string, string>
  command?: string
  network?: string
}

export interface CLIContainerStats {
  containerId: string
  cpuPercent: number
  memoryUsage: number
  memoryLimit: number
  networkRx: number
  networkTx: number
  blockRead: number
  blockWrite: number
  timestamp: number
}

export interface CLIImage {
  id: string
  repository: string
  tag: string
  createdAt: string
  size: number
  labels: Record<string, string>
  digest?: string
}

export interface CLIVolume {
  name: string
  driver: string
  mountpoint: string
  createdAt: string
  labels: Record<string, string>
  usedBy?: string[]
  size?: number
}

export interface CLINetwork {
  id: string
  name: string
  driver: string
  createdAt: string
  subnet?: string
  gateway?: string
  labels: Record<string, string>
  containers?: string[]
  internal: boolean
  /** 네트워크 상태 (예: "running") */
  state?: string
  /** IPv6 서브넷 */
  ipv6Subnet?: string
}

export interface ContainerRunOptions {
  image: string
  name?: string
  ports?: string[]
  volumes?: string[]
  env?: Record<string, string>
  labels?: Record<string, string>
  network?: string
  detach?: boolean
  start?: boolean
  rm?: boolean
  command?: string[]
}

export interface ImageBuildOptions {
  file?: string
  context: string
  tag: string
  buildArgs?: Record<string, string>
  noCache?: boolean
  target?: string
}

/**
 * Container CLI 어댑터 인터페이스
 */
export interface ContainerCLIAdapter {
  // Container 관리
  listContainers(options?: { all?: boolean }): Promise<CLIContainer[]>
  runContainer(options: ContainerRunOptions): Promise<{ id: string }>
  stopContainer(id: string, timeout?: number): Promise<void>
  startContainer(id: string): Promise<void>
  restartContainer(id: string, timeout?: number): Promise<void>
  deleteContainer(id: string, force?: boolean): Promise<void>
  inspectContainer(id: string): Promise<CLIContainer>
  getContainerStats(id: string): Promise<CLIContainerStats>

  // 스트리밍 (ChildProcess 반환으로 호출자가 제어)
  spawnContainerLogs(
    id: string,
    options?: { tail?: number; follow?: boolean }
  ): ChildProcess

  spawnContainerExec(
    id: string,
    command: string[]
  ): ChildProcess

  // Image 관리
  listImages(): Promise<CLIImage[]>
  pullImage(
    ref: string,
    onProgress?: (data: string) => void
  ): Promise<void>
  deleteImage(id: string, force?: boolean): Promise<void>
  buildImage(
    options: ImageBuildOptions,
    onProgress?: (data: string) => void
  ): Promise<{ id: string }>
  inspectImage(id: string): Promise<unknown>

  // Volume 관리
  listVolumes(): Promise<CLIVolume[]>
  createVolume(name: string, driver?: string): Promise<CLIVolume>
  deleteVolume(name: string, force?: boolean): Promise<void>
  inspectVolume(name: string): Promise<CLIVolume>
  inspectVolumeRaw(name: string): Promise<unknown>

  // Network 관리
  listNetworks(): Promise<CLINetwork[]>
  createNetwork(name: string, driver?: string, subnet?: string): Promise<CLINetwork>
  deleteNetwork(id: string, force?: boolean): Promise<void>
  inspectNetwork(id: string): Promise<CLINetwork>

  // 시스템
  checkCLIAvailable(): Promise<boolean>
  getCLIPath(): Promise<string | undefined>
  getCLIVersion(): Promise<string>
  getSystemInfo(): Promise<{
    runningContainers: number
    totalContainers: number
    imageCount: number
    volumeCount: number
  }>
}
