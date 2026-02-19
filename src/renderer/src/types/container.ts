/**
 * Container 관련 타입 정의
 * Apple Container CLI의 출력을 파싱한 결과 구조체
 */

export type ContainerStatus = 'running' | 'stopped' | 'error' | 'paused' | 'restarting' | 'created' | 'exited' | 'removing' | 'dead'

export interface ContainerPort {
  /** 호스트 포트 */
  hostPort: number
  /** 컨테이너 내부 포트 */
  containerPort: number
  /** 프로토콜 (tcp/udp) */
  protocol: 'tcp' | 'udp'
}

export interface ContainerMount {
  /** 마운트 타입 */
  type: 'bind' | 'volume'
  /** 호스트 소스 경로 또는 볼륨 이름 */
  source: string
  /** 컨테이너 내부 대상 경로 */
  target: string
  /** 읽기 전용 여부 */
  readonly: boolean
}

export interface Container {
  /** 컨테이너 고유 ID (short 또는 full) */
  id: string
  /** 컨테이너 이름 */
  name: string
  /** 사용 중인 이미지 */
  image: string
  /** 현재 상태 */
  status: ContainerStatus
  /** 생성 시각 (ISO8601) */
  createdAt: string
  /** 시작 시각 (ISO8601) */
  startedAt?: string
  /** 포트 매핑 */
  ports: ContainerPort[]
  /** 볼륨/바인드 마운트 */
  mounts: ContainerMount[]
  /** 환경 변수 */
  env: Record<string, string>
  /** 레이블 */
  labels: Record<string, string>
  /** 명령어 */
  command?: string
  /** 네트워크 이름 */
  network?: string
}

export interface ContainerStats {
  /** 컨테이너 ID */
  containerId: string
  /** CPU 사용률 (0-100) */
  cpuPercent: number
  /** 메모리 사용량 (bytes) */
  memoryUsage: number
  /** 메모리 제한 (bytes) */
  memoryLimit: number
  /** 네트워크 수신 (bytes) */
  networkRx: number
  /** 네트워크 송신 (bytes) */
  networkTx: number
  /** 디스크 읽기 (bytes) */
  blockRead: number
  /** 디스크 쓰기 (bytes) */
  blockWrite: number
  /** 측정 시각 */
  timestamp: number
}

export interface ContainerRunOptions {
  /** 이미지 이름 */
  image: string
  /** 컨테이너 이름 (선택) */
  name?: string
  /** 포트 매핑 (hostPort:containerPort) */
  ports?: string[]
  /** 볼륨 마운트 (source:target[:ro]) */
  volumes?: string[]
  /** 환경 변수 */
  env?: Record<string, string>
  /** 레이블 */
  labels?: Record<string, string>
  /** 네트워크 이름 */
  network?: string
  /** 백그라운드 실행 */
  detach?: boolean
  /** 컨테이너 종료 시 자동 삭제 */
  rm?: boolean
  /** 실행 명령어 */
  command?: string[]
}

export interface ContainerListOptions {
  /** 중지된 컨테이너 포함 */
  all?: boolean
}

export interface ContainerLogsOptions {
  /** 컨테이너 ID */
  id: string
  /** 출력할 라인 수 */
  tail?: number
  /** 실시간 스트리밍 */
  follow?: boolean
  /** 타임스탬프 포함 */
  timestamps?: boolean
}

export interface ContainerConfig {
  /** 이미지 이름:태그 */
  image: string
  /** 컨테이너 이름 */
  name?: string
  /** 포트 매핑 */
  ports?: Array<{
    hostPort?: number
    containerPort: number
    protocol?: 'tcp' | 'udp'
  }>
  /** 환경 변수 (KEY=VALUE 형식) */
  env?: string[]
  /** 볼륨 마운트 */
  volumes?: Array<{
    hostPath: string
    containerPath: string
    mode?: 'rw' | 'ro'
  }>
  /** 네트워크 이름 */
  network?: string
  /** 명령어 */
  command?: string[]
}
