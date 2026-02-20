/**
 * System 서비스
 * 시스템 정보 및 CLI 상태 관리
 */

import { app } from 'electron'
import * as os from 'os'
import * as fs from 'fs'
import { createCLIAdapter, type ContainerCLIAdapter, isMockMode } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('SystemService')

class SystemService {
  private adapter: ContainerCLIAdapter | null = null
  private previousCpuTimes: { idle: number; total: number } | null = null
  private diskUsageCache: { diskUsed: number; diskTotal: number; cachedAt: number } | null = null

  resetAdapter(): void {
    this.adapter = null
  }

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** CLI 가용성 확인 */
  async checkCLI(): Promise<{
    available: boolean
    path?: string
    version?: string
    error?: string
    isMock?: boolean
  }> {
    log.debug('checkCLI')

    // 개발용: 온보딩 화면 강제 표시 (CONTAINER_BOX_ONBOARDING=true)
    if (process.env.CONTAINER_BOX_ONBOARDING === 'true') {
      return { available: false, error: 'Forced onboarding mode', isMock: true }
    }

    try {
      // adapter 싱글턴 생성 트리거 — 내부에서 CLI 탐지 및 Mock 폴백 결정
      const adapter = await this.getAdapter()

      if (!isMockMode()) {
        // Real CLI 사용 중
        const path = await adapter.getCLIPath()
        const version = await adapter.getCLIVersion()
        return { available: true, path, version, isMock: false }
      } else if (process.env.CONTAINER_BOX_MOCK === 'true') {
        // 의도적 Mock 모드
        return { available: true, isMock: true }
      } else {
        // CLI 미설치 — 자동 폴백
        return { available: false, error: 'Apple Container CLI not found', isMock: true }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      log.error('checkCLI failed', error)
      return { available: false, error: message, isMock: true }
    }
  }

  /** 시스템 정보 조회 */
  async getInfo() {
    log.debug('getInfo')
    const adapter = await this.getAdapter()
    const cliInfo = await adapter.getSystemInfo()

    return {
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      ...cliInfo,
      appVersion: app.getVersion()
    }
  }

  /** CLI 버전 조회 */
  async getVersion() {
    log.debug('getVersion')
    const adapter = await this.getAdapter()
    const version = await adapter.getCLIVersion()
    return {
      version,
      isMock: isMockMode()
    }
  }

  /** 시스템 정리 (사용하지 않는 리소스 삭제) */
  async prune(options?: { volumes?: boolean }) {
    log.info('prune', options)
    const adapter = await this.getAdapter()

    let containersDeleted = 0
    let imagesDeleted = 0
    let volumesDeleted = 0

    // 중지된 컨테이너 삭제
    const containers = await adapter.listContainers({ all: true })
    for (const container of containers) {
      if (container.status === 'stopped' || container.status === 'error') {
        try {
          await adapter.deleteContainer(container.id)
          containersDeleted++
        } catch {
          // 개별 실패 무시
        }
      }
    }

    // dangling 이미지 삭제 (repository가 <none>인 것)
    const images = await adapter.listImages()
    for (const image of images) {
      if (image.repository === '<none>') {
        try {
          await adapter.deleteImage(image.id)
          imagesDeleted++
        } catch {
          // 개별 실패 무시
        }
      }
    }

    // 볼륨 정리 (옵션)
    if (options?.volumes) {
      const volumes = await adapter.listVolumes()
      const usedVolumes = new Set<string>()
      for (const container of containers) {
        for (const mount of container.mounts) {
          if (mount.type === 'volume') {
            usedVolumes.add(mount.source)
          }
        }
      }
      for (const volume of volumes) {
        if (!usedVolumes.has(volume.name)) {
          try {
            await adapter.deleteVolume(volume.name)
            volumesDeleted++
          } catch {
            // 개별 실패 무시
          }
        }
      }
    }

    log.info('prune completed', { containersDeleted, imagesDeleted, volumesDeleted })
    return {
      containersDeleted,
      imagesDeleted,
      volumesDeleted,
      spaceReclaimed: 0
    }
  }

  /** 실시간 시스템 리소스 사용량 조회 */
  async getResourceUsage() {
    log.debug('getResourceUsage')

    // CPU 사용률 계산 (이전 측정값과의 delta)
    const cpus = os.cpus()
    let idle = 0
    let total = 0
    for (const cpu of cpus) {
      idle += cpu.times.idle
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
    }

    let cpuUsage = 0
    if (this.previousCpuTimes) {
      const idleDiff = idle - this.previousCpuTimes.idle
      const totalDiff = total - this.previousCpuTimes.total
      cpuUsage = totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 100) : 0
    }
    this.previousCpuTimes = { idle, total }

    // 메모리
    const memoryTotal = os.totalmem()
    const memoryUsed = memoryTotal - os.freemem()

    const { diskUsed, diskTotal } = await this.getDiskUsage()

    return { cpuUsage, memoryUsed, memoryTotal, diskUsed, diskTotal }
  }

  /** 디스크 사용량 조회 (30초 캐시) */
  private async getDiskUsage(): Promise<{ diskUsed: number; diskTotal: number }> {
    const now = Date.now()
    if (this.diskUsageCache && now - this.diskUsageCache.cachedAt < 30000) {
      return { diskUsed: this.diskUsageCache.diskUsed, diskTotal: this.diskUsageCache.diskTotal }
    }

    const stat = await fs.promises.statfs('/')
    const diskTotal = stat.blocks * stat.bsize
    const diskUsed = diskTotal - stat.bavail * stat.bsize

    this.diskUsageCache = { diskUsed, diskTotal, cachedAt: now }
    return { diskUsed, diskTotal }
  }
}

export const systemService = new SystemService()
