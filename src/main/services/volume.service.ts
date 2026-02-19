/**
 * Volume 서비스
 * Volume 관련 비즈니스 로직
 */

import { createCLIAdapter, type ContainerCLIAdapter } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('VolumeService')

class VolumeService {
  private adapter: ContainerCLIAdapter | null = null

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 볼륨 목록 조회 (inspect 병렬 호출로 createdAt 보강) */
  async listVolumes() {
    log.debug('listVolumes')
    const adapter = await this.getAdapter()
    const volumes = await adapter.listVolumes()

    const results = await Promise.allSettled(
      volumes.map(async (volume) => {
        try {
          const raw = (await adapter.inspectVolumeRaw(volume.name)) as Record<string, unknown>[]
          const createdAt = this.extractVolumeCreatedAt(raw?.[0])
          if (createdAt) {
            return { ...volume, createdAt }
          }
        } catch {
          // inspect 실패 시 기존 데이터 유지
        }
        return volume
      })
    )

    return results.map((r, i) => (r.status === 'fulfilled' ? r.value : volumes[i]))
  }

  /** inspect JSON에서 createdAt ISO 문자열 추출 */
  private extractVolumeCreatedAt(raw: Record<string, unknown> | undefined): string | undefined {
    const ts = raw?.createdAt
    if (typeof ts === 'number' && ts > 0) {
      // Volume createdAt은 Unix epoch 초 단위 (parser.ts:193 참고)
      return new Date(ts * 1000).toISOString()
    }
    if (typeof ts === 'string' && ts) {
      return ts
    }
    return undefined
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
