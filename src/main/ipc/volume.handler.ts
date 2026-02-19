/**
 * Volume IPC 핸들러
 */

import { ipcMain } from 'electron'
import { volumeService } from '../services/volume.service'
import { validateName, ValidationError } from '../cli'
import { logger } from '../utils/logger'
import { assertTrustedIpcSender } from './security'

const log = logger.scope('VolumeHandler')

export function registerVolumeHandlers(): void {
  // 볼륨 목록 조회
  ipcMain.handle('volume:list', async (event) => {
    try {
      assertTrustedIpcSender(event, 'volume:list')
      return await volumeService.listVolumes()
    } catch (error) {
      log.error('volume:list failed', error)
      throw error
    }
  })

  // 볼륨 생성
  ipcMain.handle(
    'volume:create',
    async (event, { name, driver }: { name: string; driver?: string }) => {
      try {
        assertTrustedIpcSender(event, 'volume:create')
        validateName(name, 'volume')
        return await volumeService.createVolume(name, driver)
      } catch (error) {
        log.error('volume:create failed', error)
        if (error instanceof ValidationError) {
          throw new Error(`Validation error: ${error.message}`)
        }
        throw error
      }
    }
  )

  // 볼륨 삭제
  ipcMain.handle(
    'volume:remove',
    async (event, { name, force }: { name: string; force?: boolean }) => {
      try {
        assertTrustedIpcSender(event, 'volume:remove')
        validateName(name, 'volume')
        return await volumeService.deleteVolume(name, force)
      } catch (error) {
        log.error('volume:remove failed', error)
        throw error
      }
    }
  )

  // 볼륨 상세 조회
  ipcMain.handle('volume:inspect', async (event, { name }: { name: string }) => {
    try {
      assertTrustedIpcSender(event, 'volume:inspect')
      validateName(name, 'volume')
      return await volumeService.inspectVolumeRaw(name)
    } catch (error) {
      log.error('volume:inspect failed', error)
      throw error
    }
  })

  // 볼륨 정리
  ipcMain.handle('volume:prune', async (event) => {
    try {
      assertTrustedIpcSender(event, 'volume:prune')
      return await volumeService.pruneVolumes()
    } catch (error) {
      log.error('volume:prune failed', error)
      throw error
    }
  })

  log.info('Volume handlers registered')
}
