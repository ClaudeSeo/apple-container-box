/**
 * CLI 출력 파싱 유틸리티
 * JSON 및 텍스트 형식 출력을 타입 안전하게 변환
 */

import {
  CLIErrorCode,
  type CLIContainerJSON,
  type CLIImageJSON,
  type CLIVolumeJSON,
  type CLINetworkJSON,
  type CLIParseResult,
  type PullProgressEvent,
  type BuildProgressEvent
} from './types'
import type {
  CLIContainer,
  CLIContainerStats,
  CLIImage,
  CLIVolume,
  CLINetwork
} from './adapter.interface'

/**
 * JSON 출력 파싱
 */
export function parseJSON<T>(output: string): CLIParseResult<T> {
  try {
    const data = JSON.parse(output.trim()) as T
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        raw: output
      }
    }
  }
}

/**
 * Container JSON 배열 → CLIContainer 배열 변환
 */
export function parseContainerList(output: string): CLIParseResult<CLIContainer[]> {
  const result = parseJSON<CLIContainerJSON[]>(output)
  if (!result.success) {
    return {
      success: false,
      error: result.error
    }
  }

  try {
    const containers = result.data!.map(transformContainer)
    return { success: true, data: containers }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to transform container data: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

/** Apple epoch (2001-01-01) → Unix epoch (1970-01-01) 변환 오프셋 (초) */
const APPLE_EPOCH_OFFSET = 978307200

function transformContainer(raw: CLIContainerJSON): CLIContainer {
  const cfg = raw.configuration
  const createdAt = raw.startedDate
    ? new Date((raw.startedDate + APPLE_EPOCH_OFFSET) * 1000).toISOString()
    : new Date().toISOString()

  const mounts = cfg.mounts.map((m) => {
    const mountType = Object.keys(m.type)[0]
    return {
      type: (mountType === 'bind' ? 'bind' : 'volume') as 'bind' | 'volume',
      source: m.source || mountType,
      target: m.destination,
      readonly: cfg.readOnly
    }
  })

  const command = cfg.initProcess
    ? [cfg.initProcess.executable, ...cfg.initProcess.arguments].join(' ')
    : undefined

  return {
    id: cfg.id,
    name: cfg.id,
    image: cfg.image.reference,
    status: parseContainerStatus(raw.status),
    createdAt,
    ports: [],
    mounts,
    env: {},
    labels: cfg.labels || {},
    command,
    network: raw.networks[0]?.network
  }
}

function parseContainerStatus(state: string): CLIContainer['status'] {
  const lower = state.toLowerCase()
  if (lower.includes('running')) return 'running'
  if (lower.includes('exited') || lower.includes('stopped')) return 'stopped'
  if (lower.includes('paused')) return 'paused'
  if (lower.includes('restarting')) return 'restarting'
  if (lower.includes('dead') || lower.includes('error')) return 'error'
  return 'stopped'
}

/**
 * 이미지 레퍼런스 문자열에서 repository와 tag 추출
 */
function parseImageReference(ref: string): { repository: string; tag: string } {
  const lastColon = ref.lastIndexOf(':')
  if (lastColon === -1) return { repository: ref, tag: '<none>' }
  return { repository: ref.slice(0, lastColon), tag: ref.slice(lastColon + 1) }
}

/**
 * Image JSON 배열 → CLIImage 배열 변환
 */
export function parseImageList(output: string): CLIParseResult<CLIImage[]> {
  const result = parseJSON<CLIImageJSON[]>(output)
  if (!result.success) {
    return { success: false, error: result.error } as CLIParseResult<CLIImage[]>
  }

  try {
    const images = result.data!.map((raw) => {
      const { repository, tag } = parseImageReference(raw.reference)
      return {
        id: raw.descriptor.digest,
        repository,
        tag,
        createdAt: raw.descriptor.annotations?.['org.opencontainers.image.created'] ?? '',
        size: parseSizeString(raw.fullSize),
        labels: raw.descriptor.annotations ?? {},
        digest: raw.descriptor.digest
      }
    })
    return { success: true, data: images }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to transform image data: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

/**
 * 크기 문자열 파싱 (예: "1.2GB", "500MB", "100kB")
 */
export function parseSizeString(sizeStr: string): number {
  if (!sizeStr) return 0
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  const unit = (match[2] || 'B').toUpperCase()
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  }
  return Math.round(value * (multipliers[unit] || 1))
}

/**
 * Volume JSON 배열 → CLIVolume 배열 변환
 */
export function parseVolumeList(output: string): CLIParseResult<CLIVolume[]> {
  const result = parseJSON<CLIVolumeJSON[]>(output)
  if (!result.success) {
    return { success: false, error: result.error } as CLIParseResult<CLIVolume[]>
  }

  try {
    const volumes = result.data!.map((raw) => ({
      name: raw.name,
      driver: raw.driver,
      mountpoint: raw.source ?? '',
      createdAt: raw.createdAt ? new Date(raw.createdAt * 1000).toISOString() : '',
      labels: raw.labels,
      size: raw.sizeInBytes
    }))
    return { success: true, data: volumes }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to transform volume data: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

function transformNetwork(raw: CLINetworkJSON): CLINetwork {
  const createdAt = raw.config.creationDate
    ? new Date((raw.config.creationDate + APPLE_EPOCH_OFFSET) * 1000).toISOString()
    : ''
  return {
    id: raw.id || raw.config.id || '',
    name: raw.id || raw.config.id || '',
    driver: raw.config.mode || '',
    createdAt,
    subnet: raw.status?.ipv4Subnet,
    gateway: raw.status?.ipv4Gateway,
    labels: raw.config.labels || {},
    internal: false,
    state: raw.state,
    ipv6Subnet: raw.status?.ipv6Subnet
  }
}

/**
 * Network JSON 배열 → CLINetwork 배열 변환
 */
export function parseNetworkList(output: string): CLIParseResult<CLINetwork[]> {
  const result = parseJSON<CLINetworkJSON[]>(output)
  if (!result.success) {
    return { success: false, error: result.error } as CLIParseResult<CLINetwork[]>
  }

  try {
    const networks = result.data!.map(transformNetwork)
    return { success: true, data: networks }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to transform network data: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

/**
 * Network inspect JSON (단일 객체 또는 배열) → CLINetwork 변환
 */
export function parseNetworkInspect(output: string): CLIParseResult<CLINetwork> {
  try {
    const trimmed = output.trim()
    // inspect는 단일 객체 또는 배열 형식 모두 지원
    const parsed = JSON.parse(trimmed)
    const raw: CLINetworkJSON = Array.isArray(parsed) ? parsed[0] : parsed
    if (!raw) {
      return {
        success: false,
        error: { code: CLIErrorCode.NOT_FOUND, message: 'Network not found in output' }
      }
    }
    return { success: true, data: transformNetwork(raw) }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to parse network inspect: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

/**
 * Stats JSON 파싱
 */
export function parseContainerStats(output: string, containerId: string): CLIParseResult<CLIContainerStats> {
  try {
    // 예상 형식:
    // - Legacy: {"cpu": 5.2, "memory": {"usage": 123456, "limit": 1000000}, ...}
    // - Apple:  [{"cpuUsageUsec": 40855, "memoryUsageBytes": 22097920, ...}]
    const parsed = JSON.parse(output.trim())
    const raw = Array.isArray(parsed) ? parsed[0] : parsed
    const toNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) return value
      return undefined
    }
    const stats: CLIContainerStats = {
      containerId,
      cpuPercent: toNumber(raw?.cpu) ?? toNumber(raw?.CPUPerc) ?? 0,
      memoryUsage: toNumber(raw?.memory?.usage) ?? toNumber(raw?.MemUsage) ?? toNumber(raw?.memoryUsageBytes) ?? 0,
      memoryLimit: toNumber(raw?.memory?.limit) ?? toNumber(raw?.MemLimit) ?? toNumber(raw?.memoryLimitBytes) ?? 0,
      networkRx: toNumber(raw?.network?.rx) ?? toNumber(raw?.NetIO?.rx) ?? toNumber(raw?.networkRxBytes) ?? 0,
      networkTx: toNumber(raw?.network?.tx) ?? toNumber(raw?.NetIO?.tx) ?? toNumber(raw?.networkTxBytes) ?? 0,
      blockRead: toNumber(raw?.block?.read) ?? toNumber(raw?.BlockIO?.read) ?? toNumber(raw?.blockReadBytes) ?? 0,
      blockWrite: toNumber(raw?.block?.write) ?? toNumber(raw?.BlockIO?.write) ?? toNumber(raw?.blockWriteBytes) ?? 0,
      timestamp: Date.now()
    }
    return { success: true, data: stats }
  } catch (error) {
    return {
      success: false,
      error: {
        code: CLIErrorCode.PARSE_ERROR,
        message: `Failed to parse stats: ${error instanceof Error ? error.message : 'Unknown'}`,
        raw: output
      }
    }
  }
}

/**
 * CLI 에러 출력에서 에러 코드 추출
 */
export function parseErrorCode(stderr: string): CLIErrorCode {
  const lower = stderr.toLowerCase()
  if (lower.includes('not found') || lower.includes('no such')) {
    return CLIErrorCode.NOT_FOUND
  }
  if (lower.includes('already exists') || lower.includes('in use')) {
    return CLIErrorCode.ALREADY_EXISTS
  }
  if (lower.includes('permission denied') || lower.includes('access denied')) {
    return CLIErrorCode.PERMISSION_DENIED
  }
  return CLIErrorCode.UNKNOWN
}

/** phase 기반 fallback percent (total을 알 수 없을 때 사용) */
const PHASE_FALLBACK_PERCENT: Record<string, number> = {
  resolving: 5,
  downloading: 30,
  extracting: 70,
  verifying: 90,
  complete: 100,
  error: 0,
}

/**
 * CLI pull 출력 한 줄을 PullProgressEvent로 변환
 * - 단조 증가 보장은 service layer에서 처리
 */
export function parsePullProgress(raw: string): PullProgressEvent {
  const line = raw.trim()
  const message = line

  // 레이어 ID 추출: "abc123ef: Downloading ..."
  const layerMatch = line.match(/^([a-f0-9]{8,})\s*:\s*(.+)/i)
  const layerId = layerMatch?.[1]
  const content = layerMatch ? layerMatch[2] : line

  // 에러/실패 키워드 우선 체크
  if (/error|fail/i.test(content)) {
    return { phase: 'error', percent: 0, message, layerId }
  }

  // 완료 키워드
  if (/complet/i.test(content)) {
    return { phase: 'complete', percent: 100, message, layerId }
  }

  // 바이트 진행률: "15.3MB / 50.1MB"
  const byteMatch = content.match(
    /([\d.]+)\s*(B|KB|MB|GB)\s*\/\s*([\d.]+)\s*(B|KB|MB|GB)/i
  )
  if (byteMatch) {
    const current = parseSizeString(`${byteMatch[1]}${byteMatch[2]}`)
    const total = parseSizeString(`${byteMatch[3]}${byteMatch[4]}`)
    const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

    // 컨텐츠 키워드로 phase 결정
    let phase: PullProgressEvent['phase'] = 'downloading'
    if (/extract/i.test(content)) phase = 'extracting'
    else if (/verif/i.test(content)) phase = 'verifying'

    return { phase, current, total, percent, message, layerId }
  }

  // 퍼센트 직접 추출: "63%"
  const pctMatch = content.match(/(\d+)%/)
  if (pctMatch) {
    const percent = Math.min(100, parseInt(pctMatch[1], 10))
    let phase: PullProgressEvent['phase'] = 'downloading'
    if (/extract/i.test(content)) phase = 'extracting'
    else if (/verif/i.test(content)) phase = 'verifying'
    return { phase, percent, message, layerId }
  }

  // 키워드 기반 phase 결정
  let phase: PullProgressEvent['phase'] = 'resolving'
  if (/download/i.test(content)) phase = 'downloading'
  else if (/extract/i.test(content)) phase = 'extracting'
  else if (/verif/i.test(content)) phase = 'verifying'
  else if (/pull|resolv/i.test(content)) phase = 'resolving'

  const percent = PHASE_FALLBACK_PERCENT[phase] ?? 0
  return { phase, percent, message, layerId }
}

/**
 * CLI build 출력 한 줄을 BuildProgressEvent로 변환
 * - 단조 증가 보장은 service layer에서 처리
 */
export function parseBuildProgress(raw: string): BuildProgressEvent {
  const line = raw.trim()
  const message = line

  // 빌드 성공
  if (/successfully built/i.test(line)) {
    return { phase: 'complete', percent: 100, message }
  }

  // 에러/실패
  if (/error|fail/i.test(line)) {
    return { phase: 'error', percent: 0, message }
  }

  // Step N/M 패턴: "Step 2/5 : RUN apt-get install ..."
  const stepMatch = line.match(/Step\s+(\d+)\s*\/\s*(\d+)/i)
  if (stepMatch) {
    const step = parseInt(stepMatch[1], 10)
    const totalSteps = parseInt(stepMatch[2], 10)
    const percent = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0
    return { phase: 'extracting', step, totalSteps, percent, message }
  }

  // fallback: 진행 중 상태로 취급
  return { phase: 'extracting', percent: 0, message }
}

/** ANSI escape sequence 제거 */
export function stripAnsi(str: string): string {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, 'g')
  return str.replace(ansiPattern, '')
}
