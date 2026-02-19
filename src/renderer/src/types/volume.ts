/**
 * Volume 관련 타입 정의
 */

export interface Volume {
  /** 볼륨 이름 */
  name: string
  /** 드라이버 */
  driver: string
  /** 마운트포인트 경로 */
  mountpoint: string
  /** 생성 시각 (ISO8601) */
  createdAt: string
  /** 레이블 */
  labels: Record<string, string>
  /** 사용 중인 컨테이너 ID 목록 */
  usedBy?: string[]
  /** 볼륨 크기 (bytes, 지원 시) */
  size?: number
}

export interface VolumeCreateOptions {
  /** 볼륨 이름 */
  name: string
  /** 드라이버 (기본: local) */
  driver?: string
  /** 드라이버 옵션 */
  driverOpts?: Record<string, string>
  /** 레이블 */
  labels?: Record<string, string>
}

export interface VolumeRemoveOptions {
  /** 볼륨 이름 */
  name: string
  /** 강제 삭제 */
  force?: boolean
}

export interface VolumeInspect extends Volume {
  /** 옵션 */
  options: Record<string, string>
  /** 스코프 (local/global) */
  scope: 'local' | 'global'
}

export interface VolumePruneResult {
  /** 삭제된 볼륨 이름 목록 */
  deleted: string[]
  /** 회수된 공간 (bytes) */
  spaceReclaimed: number
}
