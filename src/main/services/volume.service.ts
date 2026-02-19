/**
 * Volume 서비스
 * Volume 관련 비즈니스 로직
 */

import { createCLIAdapter, type CLIVolume, type ContainerCLIAdapter } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('VolumeService')
const VOLUME_CREATED_AT_CACHE_TTL_MS = 60_000

interface VolumeCreatedAtCacheEntry {
  value: string
  expiresAt: number
}

class VolumeService {
  private adapter: ContainerCLIAdapter | null = null
  private volumeCreatedAtCache = new Map<string, VolumeCreatedAtCacheEntry>()

  resetAdapter(): void {
    this.adapter = null
    this.volumeCreatedAtCache.clear()
  }

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 볼륨 목록 조회 */
  async listVolumes() {
    log.debug('listVolumes')
    const adapter = await this.getAdapter()
    const volumes = await adapter.listVolumes()
    const now = Date.now()

    const activeNames = new Set(volumes.map((volume) => volume.name))
    for (const [name, entry] of this.volumeCreatedAtCache) {
      if (entry.expiresAt <= now || !activeNames.has(name)) {
        this.volumeCreatedAtCache.delete(name)
      }
    }

    const enrichedVolumes = await Promise.all(
      volumes.map(async (volume) => {
        const cached = this.volumeCreatedAtCache.get(volume.name)
        if (cached && cached.expiresAt > now) {
          return {
            ...volume,
            createdAt: cached.value
          } satisfies CLIVolume
        }

        try {
          const inspected = await adapter.inspectVolume(volume.name)
          const createdAt = inspected.createdAt || volume.createdAt
          this.volumeCreatedAtCache.set(volume.name, {
            value: createdAt,
            expiresAt: now + VOLUME_CREATED_AT_CACHE_TTL_MS
          })
          return {
            ...volume,
            createdAt
          } satisfies CLIVolume
        } catch (error) {
          log.warn('listVolumes inspectVolume failed', {
            name: volume.name,
            error: error instanceof Error ? error.message : String(error)
          })
          return volume
        }
      })
    )

    return enrichedVolumes
  }

  /** 볼륨 생성 */
  async createVolume(name: string, driver?: string) {
    log.info('createVolume', { name, driver })
    const adapter = await this.getAdapter()
    return adapter.createVolume(name, driver)
  }

  /** 볼륨 삭제 */
  async deleteVolume(name: string, force?: boolean) {
    log.info('deleteVolume', { name, force })
    const adapter = await this.getAdapter()
    return adapter.deleteVolume(name, force)
  }

  /** 볼륨 상세 조회 */
  async inspectVolume(name: string) {
    log.debug('inspectVolume', { name })
    const adapter = await this.getAdapter()
    return adapter.inspectVolume(name)
  }

  /** 볼륨 raw inspect (CLI 원본 JSON) */
  async inspectVolumeRaw(name: string) {
    log.debug('inspectVolumeRaw', { name })
    const adapter = await this.getAdapter()
    return adapter.inspectVolumeRaw(name)
  }

  /** 사용하지 않는 볼륨 정리 */
  async pruneVolumes() {
    log.info('pruneVolumes')
    const adapter = await this.getAdapter()

    // 모든 볼륨 조회
    const volumes = await adapter.listVolumes()
    const containers = await (await createCLIAdapter()).listContainers({ all: true })

    // 사용 중인 볼륨 식별
    const usedVolumes = new Set<string>()
    for (const container of containers) {
      for (const mount of container.mounts) {
        if (mount.type === 'volume') {
          usedVolumes.add(mount.source)
        }
      }
    }

    // 사용하지 않는 볼륨 삭제
    const deleted: string[] = []
    for (const volume of volumes) {
      if (!usedVolumes.has(volume.name)) {
        try {
          await adapter.deleteVolume(volume.name)
          deleted.push(volume.name)
        } catch (error) {
          log.warn(`Failed to delete volume ${volume.name}`, error)
        }
      }
    }

    log.info('pruneVolumes completed', { deleted: deleted.length })
    return {
      deleted,
      spaceReclaimed: 0 // CLI에서 크기 정보 제공 시 업데이트
    }
  }
}

export const volumeService = new VolumeService()
