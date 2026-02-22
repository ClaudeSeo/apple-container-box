/**
 * CLI 입출력 타입 정의 (Main Process 전용)
 * Apple Container CLI와의 직접 통신에 사용
 */

/** CLI 명령 실행 옵션 */
export interface CLIExecOptions {
  /** 실행할 명령어 */
  command: string
  /** 명령어 인자 */
  args: string[]
  /** 타임아웃 (ms) */
  timeout?: number
  /** 작업 디렉토리 */
  cwd?: string
  /** 환경 변수 */
  env?: Record<string, string>
}

/** CLI 명령 실행 결과 */
export interface CLIExecResult {
  /** 종료 코드 */
  exitCode: number
  /** 표준 출력 */
  stdout: string
  /** 표준 에러 */
  stderr: string
  /** 실행 시간 (ms) */
  duration: number
}

/** CLI 스트리밍 이벤트 */
export interface CLIStreamEvent {
  /** 이벤트 타입 */
  type: 'stdout' | 'stderr' | 'exit' | 'error'
  /** 데이터 */
  data?: string
  /** 종료 코드 (exit 이벤트 시) */
  exitCode?: number
  /** 에러 (error 이벤트 시) */
  error?: Error
}

/** CLI 파서 결과 */
export interface CLIParseResult<T> {
  /** 파싱 성공 여부 */
  success: boolean
  /** 파싱된 데이터 */
  data?: T
  /** 에러 정보 */
  error?: {
    code: string
    message: string
    raw?: string
  }
}

/** JSON 형식 출력 (container list --format json 등) */
export interface CLIContainerJSON {
  status: string
  configuration: {
    id: string
    image: {
      reference: string
      descriptor: {
        mediaType: string
        digest: string
        size: number
      }
    }
    labels: Record<string, string>
    platform: {
      os: string
      variant: string
      architecture: string
    }
    initProcess: {
      executable: string
      arguments: string[]
      environment: string[]
      workingDirectory: string
      terminal: boolean
      supplementalGroups: number[]
      rlimits: unknown[]
    }
    networks: Array<{
      network: string
      options: Record<string, string>
    }>
    mounts: Array<{
      type: Record<string, unknown>
      options: string[]
      source: string
      destination: string
    }>
    resources: {
      memoryInBytes: number
      cpus: number
    }
    publishedPorts: unknown[]
    publishedSockets: unknown[]
    runtimeHandler: string
    rosetta: boolean
    readOnly: boolean
    ssh: boolean
    virtualization: boolean
    sysctls: Record<string, string>
    dns: {
      nameservers: string[]
      searchDomains: string[]
      options: string[]
    }
  }
  /** Apple epoch (2001-01-01 기준 초) */
  startedDate?: number
  networks: Array<{
    hostname: string
    ipv4Address: string
    ipv4Gateway: string
    ipv6Address: string
    macAddress: string
    network: string
  }>
}

export interface CLIImageJSON {
  descriptor: {
    digest: string
    size: number
    annotations?: Record<string, string>
    mediaType: string
  }
  fullSize: string
  reference: string
}

export interface CLIVolumeJSON {
  name: string
  driver: string
  createdAt: number
  labels: Record<string, string>
  source?: string
  format?: string
  sizeInBytes?: number
  options?: Record<string, unknown>
}

export interface CLINetworkJSON {
  id: string
  state: string
  config: {
    id: string
    mode: string
    labels: Record<string, string>
    /** Apple epoch (2001-01-01 기준 초) */
    creationDate: number
  }
  status?: {
    ipv4Gateway?: string
    ipv4Subnet?: string
    ipv6Subnet?: string
  }
}

/** CLI 에러 코드 */
export enum CLIErrorCode {
  /** CLI 바이너리를 찾을 수 없음 */
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  /** 명령 실행 타임아웃 */
  TIMEOUT = 'TIMEOUT',
  /** 파싱 실패 */
  PARSE_ERROR = 'PARSE_ERROR',
  /** 리소스를 찾을 수 없음 */
  NOT_FOUND = 'NOT_FOUND',
  /** 이미 존재함 */
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  /** 권한 부족 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 알 수 없는 에러 */
  UNKNOWN = 'UNKNOWN'
}

/** CLI 에러 */
export class CLIError extends Error {
  constructor(
    public readonly code: CLIErrorCode,
    message: string,
    public readonly raw?: string
  ) {
    super(message)
    this.name = 'CLIError'
  }
}

/** Pull/Build 진행 단계 */
export type ProgressPhase = 'resolving' | 'downloading' | 'extracting' | 'verifying' | 'complete' | 'error'

/** 이미지 Pull 진행률 이벤트 */
export interface PullProgressEvent {
  phase: ProgressPhase
  /** 현재 바이트 수 */
  current?: number
  /** 전체 바이트 수 */
  total?: number
  /** 진행률 (0-100) */
  percent: number
  /** 원본 메시지 */
  message: string
  /** 레이어 ID (있을 경우) */
  layerId?: string
}

/** 이미지 Build 진행률 이벤트 */
export interface BuildProgressEvent {
  phase: ProgressPhase
  /** 현재 바이트 수 */
  current?: number
  /** 전체 바이트 수 */
  total?: number
  /** 진행률 (0-100) */
  percent: number
  /** 원본 메시지 */
  message: string
  /** 현재 스텝 번호 */
  step?: number
  /** 전체 스텝 수 */
  totalSteps?: number
}
