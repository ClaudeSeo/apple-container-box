/**
 * Network 관련 타입 정의
 */

export interface Network {
  /** 네트워크 ID */
  id: string
  /** 네트워크 이름 */
  name: string
  /** 드라이버 (nat, bridge 등) */
  driver: string
  /** 생성 시각 (ISO8601) */
  createdAt: string
  /** IPv4 서브넷 */
  subnet?: string
  /** IPv4 게이트웨이 */
  gateway?: string
  /** 레이블 */
  labels: Record<string, string>
  /** 연결된 컨테이너 ID 목록 */
  containers?: string[]
  /** 내부 네트워크 여부 */
  internal: boolean
  /** 네트워크 상태 (예: "running") */
  state?: string
  /** IPv6 서브넷 */
  ipv6Subnet?: string
}

export interface NetworkCreateOptions {
  /** 네트워크 이름 */
  name: string
  /** 드라이버 (기본: bridge) */
  driver?: string
  /** 서브넷 (CIDR 형식) */
  subnet?: string
  /** 게이트웨이 */
  gateway?: string
  /** IP 범위 */
  ipRange?: string
  /** 내부 네트워크 여부 */
  internal?: boolean
  /** 레이블 */
  labels?: Record<string, string>
}

export interface NetworkRemoveOptions {
  /** 네트워크 ID 또는 이름 */
  id: string
  /** 강제 삭제 */
  force?: boolean
}

export interface NetworkConnectOptions {
  /** 네트워크 ID 또는 이름 */
  network: string
  /** 컨테이너 ID 또는 이름 */
  container: string
  /** 할당할 IP 주소 */
  ip?: string
  /** 별칭 */
  alias?: string[]
}

export interface NetworkDisconnectOptions {
  /** 네트워크 ID 또는 이름 */
  network: string
  /** 컨테이너 ID 또는 이름 */
  container: string
  /** 강제 연결 해제 */
  force?: boolean
}

export interface NetworkInspect extends Network {
  /** IPAM 설정 */
  ipam: {
    driver: string
    config: Array<{
      subnet?: string
      gateway?: string
      ipRange?: string
    }>
  }
  /** 옵션 */
  options: Record<string, string>
  /** 스코프 */
  scope: 'local' | 'global' | 'swarm'
  /** 연결된 컨테이너 상세 정보 */
  containerDetails: Record<
    string,
    {
      name: string
      endpointId: string
      macAddress: string
      ipv4Address: string
      ipv6Address?: string
    }
  >
}
