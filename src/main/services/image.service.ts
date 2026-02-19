/**
 * Image 서비스
 * Image 관련 비즈니스 로직
 */

import { BrowserWindow } from 'electron'
import { createCLIAdapter, type ContainerCLIAdapter, type ImageBuildOptions } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('ImageService')

class ImageService {
  private adapter: ContainerCLIAdapter | null = null

  resetAdapter(): void {
    this.adapter = null
  }

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 이미지 목록 조회 (inspect 병렬 호출로 createdAt 보강) */
  async listImages() {
    log.debug('listImages')
    const adapter = await this.getAdapter()
    const images = await adapter.listImages()

    // 각 이미지에 대해 inspect 병렬 호출
    const results = await Promise.allSettled(
      images.map(async (image) => {
        try {
          const ref = `${image.repository}:${image.tag}`
          const raw = (await adapter.inspectImage(ref)) as Record<string, unknown>[]
          // variants[0].config.created 경로에서 OCI created 필드 추출
          const variant = raw?.[0]?.variants as Record<string, unknown>[] | undefined
          const config = variant?.[0]?.config as Record<string, unknown> | undefined
          const created = typeof config?.created === 'string' ? config.created : undefined
          if (created) {
            return { ...image, createdAt: created }
          }
        } catch {
          // inspect 실패 시 기존 데이터 유지
        }
        return image
      })
    )

    return results.map((r, i) => (r.status === 'fulfilled' ? r.value : images[i]))
  }

  /** 이미지 풀 (진행 상황 이벤트 발생) */
  async pullImage(image: string) {
    log.info('pullImage', { image })
    const adapter = await this.getAdapter()

    const windows = BrowserWindow.getAllWindows()
    const mainWindow = windows[0]

    await adapter.pullImage(image, (progress) => {
      // Renderer에 진행 상황 전송
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('image:pull:progress', {
          image,
          status: progress,
          current: undefined,
          total: undefined
        })
      }
    })

    log.info('pullImage completed', { image })
  }

  /** 이미지 삭제 */
  async deleteImage(id: string, force?: boolean) {
    log.info('deleteImage', { id, force })
    const adapter = await this.getAdapter()
    return adapter.deleteImage(id, force)
  }

  /** 이미지 상세 조회 */
  async inspectImage(id: string) {
    log.debug('inspectImage', { id })
    const adapter = await this.getAdapter()
    return adapter.inspectImage(id)
  }

  /** 이미지 빌드 */
  async buildImage(options: ImageBuildOptions) {
    log.info('buildImage', { tag: options.tag, context: options.context })
    const adapter = await this.getAdapter()

    const windows = BrowserWindow.getAllWindows()
    const mainWindow = windows[0]

    const result = await adapter.buildImage(options, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('image:build:progress', {
          tag: options.tag,
          status: progress
        })
      }
    })

    log.info('buildImage completed', { id: result.id })
    return result
  }
}

export const imageService = new ImageService()
