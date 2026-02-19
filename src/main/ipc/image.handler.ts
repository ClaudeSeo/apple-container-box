/**
 * Image IPC 핸들러
 */

import { ipcMain } from 'electron'
import { imageService } from '../services/image.service'
import { validateImageRef, ValidationError } from '../cli'
import { logger } from '../utils/logger'
import { assertTrustedIpcSender } from './security'

const log = logger.scope('ImageHandler')

export function registerImageHandlers(): void {
  // 이미지 목록 조회
  ipcMain.handle('image:list', async (event) => {
    try {
      assertTrustedIpcSender(event, 'image:list')
      return await imageService.listImages()
    } catch (error) {
      log.error('image:list failed', error)
      throw error
    }
  })

  // 이미지 풀
  ipcMain.handle('image:pull', async (event, { image }: { image: string }) => {
    try {
      assertTrustedIpcSender(event, 'image:pull')
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
  ipcMain.handle('image:remove', async (event, { id, force }: { id: string; force?: boolean }) => {
    try {
      assertTrustedIpcSender(event, 'image:remove')
      return await imageService.deleteImage(id, force)
    } catch (error) {
      log.error('image:remove failed', error)
      throw error
    }
  })

  // 이미지 상세 조회
  ipcMain.handle('image:inspect', async (event, { id }: { id: string }) => {
    try {
      assertTrustedIpcSender(event, 'image:inspect')
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
      event,
      options: {
        file?: string
        context: string
        tag: string
        buildArgs?: Record<string, string>
        noCache?: boolean
      }
    ) => {
      try {
        assertTrustedIpcSender(event, 'image:build')
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
