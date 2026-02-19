/**
 * CLI 입력 검증 유틸리티
 * 보안을 위한 화이트리스트 기반 검증
 */

/** 컨테이너/볼륨/네트워크 이름 패턴 */
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/

/** 이미지 레퍼런스 패턴 (repository[:tag][@digest]) */
const IMAGE_REF_PATTERN = /^[a-z0-9]+(([._-]|__)[a-z0-9]+)*(\/[a-z0-9]+(([._-]|__)[a-z0-9]+)*)*(:[\w][\w.-]{0,127})?(@sha256:[a-f0-9]{64})?$/i

/** 포트 매핑 패턴 (hostPort:containerPort[/protocol]) */
const PORT_MAPPING_PATTERN = /^(\d{1,5}):(\d{1,5})(\/(?:tcp|udp))?$/

/** 볼륨 마운트 패턴 (source:target[:ro]) */
const VOLUME_MOUNT_PATTERN = /^([^:]+):([^:]+)(:ro)?$/

/** 환경 변수 키 패턴 */
const ENV_KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** 쉘 메타문자 블랙리스트 */
const SHELL_METACHAR_PATTERN = /[;|&$`\\<>(){}[\]!#*?~]/

/**
 * 컨테이너/볼륨/네트워크 이름 검증
 */
export function validateName(name: string, type: 'container' | 'volume' | 'network'): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(`${type} name is required`)
  }
  if (!NAME_PATTERN.test(name)) {
    throw new ValidationError(
      `Invalid ${type} name: must start with alphanumeric and contain only alphanumeric, underscore, dot, or dash (max 255 chars)`
    )
  }
}

/**
 * 이미지 레퍼런스 검증
 */
export function validateImageRef(ref: string): void {
  if (!ref || typeof ref !== 'string') {
    throw new ValidationError('Image reference is required')
  }
  if (!IMAGE_REF_PATTERN.test(ref)) {
    throw new ValidationError(
      `Invalid image reference: ${ref}. Expected format: repository[:tag][@digest]`
    )
  }
  // 추가: 허용된 레지스트리만 (선택적)
  const allowedRegistries = ['docker.io', 'ghcr.io', 'quay.io', 'gcr.io', 'registry.k8s.io']
  const parts = ref.split('/')
  if (parts.length > 1 && parts[0].includes('.')) {
    const registry = parts[0]
    if (!allowedRegistries.some((r) => registry === r || registry.endsWith(`.${r}`))) {
      // 경고만 로그, 차단하지 않음
      console.warn(`Registry ${registry} is not in allowlist`)
    }
  }
}

/**
 * 포트 매핑 검증
 */
export function validatePortMapping(mapping: string): { host: number; container: number; protocol: 'tcp' | 'udp' } {
  const match = mapping.match(PORT_MAPPING_PATTERN)
  if (!match) {
    throw new ValidationError(
      `Invalid port mapping: ${mapping}. Expected format: hostPort:containerPort[/tcp|udp]`
    )
  }
  const hostPort = parseInt(match[1], 10)
  const containerPort = parseInt(match[2], 10)
  const protocol = (match[3]?.slice(1) || 'tcp') as 'tcp' | 'udp'

  if (hostPort < 1 || hostPort > 65535) {
    throw new ValidationError(`Invalid host port: ${hostPort}. Must be 1-65535`)
  }
  if (containerPort < 1 || containerPort > 65535) {
    throw new ValidationError(`Invalid container port: ${containerPort}. Must be 1-65535`)
  }

  return { host: hostPort, container: containerPort, protocol }
}

/**
 * 볼륨 마운트 검증
 */
export function validateVolumeMount(mount: string): { source: string; target: string; readonly: boolean } {
  const match = mount.match(VOLUME_MOUNT_PATTERN)
  if (!match) {
    throw new ValidationError(
      `Invalid volume mount: ${mount}. Expected format: source:target[:ro]`
    )
  }
  const source = match[1]
  const target = match[2]
  const readonly = match[3] === ':ro'

  // 소스 경로에 쉘 메타문자 검사
  if (SHELL_METACHAR_PATTERN.test(source)) {
    throw new ValidationError(`Invalid characters in volume source path: ${source}`)
  }
  if (SHELL_METACHAR_PATTERN.test(target)) {
    throw new ValidationError(`Invalid characters in volume target path: ${target}`)
  }

  return { source, target, readonly }
}

/**
 * 환경 변수 검증
 */
export function validateEnvVars(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    if (!ENV_KEY_PATTERN.test(key)) {
      throw new ValidationError(
        `Invalid environment variable key: ${key}. Must start with letter or underscore`
      )
    }
    // 값에 쉘 메타문자가 있으면 경고 (하지만 허용)
    if (SHELL_METACHAR_PATTERN.test(value)) {
      console.warn(`Environment variable ${key} contains shell metacharacters`)
    }
  }
}

/**
 * 컨테이너 ID 검증 (short 또는 full)
 */
export function validateContainerId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Container ID is required')
  }
  // Apple Container CLI: 이름 기반 ID (alphanumeric, underscore, dot, dash)
  // Docker 호환: hex hash (12-64자)
  if (!NAME_PATTERN.test(id)) {
    throw new ValidationError(`Invalid container ID: ${id}`)
  }
}

/**
 * 쉘 메타문자 제거 (명령어 인자 sanitize)
 */
export function sanitizeShellArg(arg: string): string {
  return arg.replace(SHELL_METACHAR_PATTERN, '')
}

/**
 * 검증 에러
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
