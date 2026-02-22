/**
 * Image 서비스
 * Image 관련 비즈니스 로직
 */

import { BrowserWindow } from 'electron'
import {
  createCLIAdapter,
  type ContainerCLIAdapter,
  type ImageBuildOptions,
  type PullProgressEvent,
  type BuildProgressEvent,
  validateImageRef
} from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('ImageService')
const IMAGE_CREATED_AT_CACHE_TTL_MS = 60_000

interface ImageCreatedAtCacheEntry {
  value: string
  expiresAt: number
}

/** 단조 증가 보장 + 스로틀링 */
class ProgressTracker {
  private lastPercent = 0
  private lastSentAt = 0
  private readonly THROTTLE_MS = 100

  /** 단조 증가 보장된 percent 반환 */
  enforce(percent: number): number {
    this.lastPercent = Math.max(percent, this.lastPercent)
    return this.lastPercent
  }

  /** terminal 이벤트는 항상 true, 일반 이벤트는 throttle 체크 */
  shouldSend(isTerminal: boolean): boolean {
    if (isTerminal) return true
    const now = Date.now()
    if (now - this.lastSentAt < this.THROTTLE_MS) return false
    this.lastSentAt = now
    return true
  }

  reset(): void {
    this.lastPercent = 0
    this.lastSentAt = 0
  }
}

class ImageService {
  private adapter: ContainerCLIAdapter | null = null
  private imageCreatedAtCache = new Map<string, ImageCreatedAtCacheEntry>()

  resetAdapter(): void {
    this.adapter = null
    this.imageCreatedAtCache.clear()
  }

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 이미지 목록 조회 */
  async listImages() {
    log.debug('listImages')
    const adapter = await this.getAdapter()
    const images = await adapter.listImages()
    const now = Date.now()

    const enriched = await Promise.all(
      images.map(async (image) => {
        const ref = `${image.repository}:${image.tag}`
        const cacheKey = image.id || ref
        const cached = this.imageCreatedAtCache.get(cacheKey)
        if (cached && cached.expiresAt > now) {
          return {
            ...image,
            createdAt: cached.value
          }
        }

        try {
          const inspected = await adapter.inspectImage(ref)
          const createdAt = this.extractImageCreatedAt(inspected) || image.createdAt
          this.imageCreatedAtCache.set(cacheKey, {
            value: createdAt,
            expiresAt: now + IMAGE_CREATED_AT_CACHE_TTL_MS
          })
          return {
            ...image,
            createdAt
          }
        } catch (error) {
          log.warn('listImages inspectImage failed', {
            ref,
            error: error instanceof Error ? error.message : String(error)
          })
          return image
        }
      })
    )

    for (const [key, entry] of this.imageCreatedAtCache) {
      if (entry.expiresAt <= now) {
        this.imageCreatedAtCache.delete(key)
      }
    }

    return enriched
  }

  private extractImageCreatedAt(raw: unknown): string | undefined {
    const normalized = Array.isArray(raw) ? raw[0] : raw
    if (!normalized || typeof normalized !== 'object') {
      return undefined
    }

    const record = normalized as Record<string, unknown>

    if (typeof record.createdAt === 'string' && record.createdAt) {
      return record.createdAt
    }
    if (typeof record.created === 'string' && record.created) {
      return record.created
    }

    const variant = Array.isArray(record.variants)
      ? (record.variants[0] as Record<string, unknown> | undefined)
      : undefined
    const config = variant?.config as Record<string, unknown> | undefined
    if (typeof config?.created === 'string' && config.created) {
      return config.created
    }

    return undefined
  }

  /** 이미지 풀 (진행 상황 이벤트 발생) */
  async pullImage(image: string) {
    log.info('pullImage', { image })
    validateImageRef(image)
    const adapter = await this.getAdapter()

    const windows = BrowserWindow.getAllWindows()
    const mainWindow = windows[0]
    const tracker = new ProgressTracker()

    await adapter.pullImage(image, (event: PullProgressEvent) => {
      const isTerminal = event.phase === 'complete' || event.phase === 'error'
      const percent = tracker.enforce(event.percent)
      if (!tracker.shouldSend(isTerminal)) return

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('image:pull:progress', {
          image,
          phase: event.phase,
          percent,
          current: event.current,
          total: event.total,
          message: event.message,
          layerId: event.layerId,
        })
      }
    })

    log.info('pullImage completed', { image })
  }

  /** 이미지 삭제 */
  async deleteImage(id: string, force?: boolean) {
    log.info('deleteImage', { id, force })
    validateImageRef(id)
    const adapter = await this.getAdapter()
    return adapter.deleteImage(id, force)
  }

  /** 이미지 상세 조회 */
  async inspectImage(id: string) {
    log.debug('inspectImage', { id })
    validateImageRef(id)
    const adapter = await this.getAdapter()
    return adapter.inspectImage(id)
  }

  /** 이미지 빌드 */
  async buildImage(options: ImageBuildOptions) {
    log.info('buildImage', { tag: options.tag, context: options.context })
    const adapter = await this.getAdapter()

    const windows = BrowserWindow.getAllWindows()
    const mainWindow = windows[0]
    const tracker = new ProgressTracker()

    const result = await adapter.buildImage(options, (event: BuildProgressEvent) => {
      const isTerminal = event.phase === 'complete' || event.phase === 'error'
      const percent = tracker.enforce(event.percent)
      if (!tracker.shouldSend(isTerminal)) return

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('image:build:progress', {
          tag: options.tag,
          phase: event.phase,
          percent,
          message: event.message,
          step: event.step,
          totalSteps: event.totalSteps,
        })
      }
    })

    log.info('buildImage completed', { id: result.id })
    return result
  }
}

export const imageService = new ImageService()
