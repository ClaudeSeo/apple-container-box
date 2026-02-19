/**
 * Image IPC 핸들러
 */

import { ipcMain } from 'electron'
import { imageService } from '../services/image.service'
import { validateImageRef, ValidationError } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('ImageHandler')

export function registerImageHandlers(): void {
  // 이미지 목록 조회
  ipcMain.handle('image:list', async () => {
    try {
      return await imageService.listImages()
    } catch (error) {
      log.error('image:list failed', error)
      throw error
    }
  })

  // 이미지 풀
  ipcMain.handle('image:pull', async (_, { image }: { image: string }) => {
    try {
      validateImageRef(image)
      return await imageService.pullImage(image)
    } catch (error) {
      log.error('image:pull failed', error)
      if (error instanceof ValidationError) {
        throw new Error(`Validation error: ${error.message}`)
      }
      throw error
    }
  })

  // 이미지 삭제
  ipcMain.handle('image:remove', async (_, { id, force }: { id: string; force?: boolean }) => {
    try {
      return await imageService.deleteImage(id, force)
    } catch (error) {
      log.error('image:remove failed', error)
      throw error
    }
  })

  // 이미지 상세 조회
  ipcMain.handle('image:inspect', async (_, { id }: { id: string }) => {
    try {
      return await imageService.inspectImage(id)
    } catch (error) {
      log.error('image:inspect failed', error)
      throw error
    }
  })

  // 이미지 빌드
  ipcMain.handle(
    'image:build',
    async (
      _,
      options: {
        file?: string
        context: string
        tag: string
        buildArgs?: Record<string, string>
        noCache?: boolean
      }
    ) => {
      try {
        validateImageRef(options.tag)
        return await imageService.buildImage(options)
      } catch (error) {
        log.error('image:build failed', error)
        if (error instanceof ValidationError) {
          throw new Error(`Validation error: ${error.message}`)
        }
        throw error
      }
    }
  )

  log.info('Image handlers registered')
}
