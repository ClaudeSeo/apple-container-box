/**
 * Image 관련 타입 정의
 */

export interface Image {
  /** 이미지 ID (short 또는 full) */
  id: string
  /** 레포지토리 이름 */
  repository: string
  /** 태그 */
  tag: string
  /** 생성 시각 (ISO8601) */
  createdAt: string
  /** 이미지 크기 (bytes) */
  size: number
  /** 레이블 */
  labels: Record<string, string>
  /** 다이제스트 (sha256:...) */
  digest?: string
}

export interface ImageLayer {
  /** 레이어 ID */
  id: string
  /** 레이어 크기 (bytes) */
  size: number
  /** 생성 명령어 */
  createdBy: string
}

export interface ImageBuildOptions {
  /** Containerfile 경로 */
  file?: string
  /** 빌드 컨텍스트 경로 */
  context: string
  /** 태그 (이름:버전) */
  tag: string
  /** 빌드 인자 */
  buildArgs?: Record<string, string>
  /** 캐시 사용 여부 */
  noCache?: boolean
  /** 타겟 스테이지 (multi-stage 빌드) */
  target?: string
}

export interface ImagePullProgress {
  /** 이미지 레퍼런스 */
  image: string
  /** 진행 단계 */
  phase: 'resolving' | 'downloading' | 'extracting' | 'verifying' | 'complete' | 'error'
  /** 진행률 (0-100) */
  percent: number
  /** 다운로드된 바이트 */
  current?: number
  /** 전체 바이트 */
  total?: number
  /** 원본 메시지 */
  message: string
  /** 레이어 ID */
  layerId?: string
}

export interface ImageBuildProgress {
  /** 이미지 태그 */
  tag: string
  /** 진행 단계 */
  phase: 'resolving' | 'downloading' | 'extracting' | 'verifying' | 'complete' | 'error'
  /** 진행률 (0-100) */
  percent: number
  /** 현재 바이트 수 */
  current?: number
  /** 전체 바이트 수 */
  total?: number
  /** 원본 메시지 */
  message: string
  /** 현재 스텝 번호 */
  step?: number
  /** 전체 스텝 수 */
  totalSteps?: number
}

export interface ImagePullOptions {
  /** 이미지 이름 (repository:tag) */
  image: string
}

export interface ImageRemoveOptions {
  /** 이미지 ID 또는 이름 */
  id: string
  /** 강제 삭제 */
  force?: boolean
}

export interface ImageInspect {
  /** 이미지 ID */
  id: string
  /** 레포지토리:태그 목록 */
  repoTags: string[]
  /** 레포지토리 다이제스트 목록 */
  repoDigests: string[]
  /** 생성 시각 */
  created: string
  /** 아키텍처 */
  architecture: string
  /** OS */
  os: string
  /** 레이어 목록 */
  layers: ImageLayer[]
  /** 설정 (환경변수, 명령어 등) */
  config: {
    env?: string[]
    cmd?: string[]
    entrypoint?: string[]
    workingDir?: string
    exposedPorts?: Record<string, object>
    labels?: Record<string, string>
  }
}
