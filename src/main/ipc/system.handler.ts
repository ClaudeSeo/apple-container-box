/**
 * System IPC 핸들러
 */

import { ipcMain } from 'electron'
import { systemService } from '../services/system.service'
import { logger } from '../utils/logger'

const log = logger.scope('SystemHandler')

export function registerSystemHandlers(): void {
  // CLI 가용성 확인
  ipcMain.handle('system:check-cli', async () => {
    try {
      return await systemService.checkCLI()
    } catch (error) {
      log.error('system:check-cli failed', error)
      throw error
    }
  })

  // 시스템 정보 조회
  ipcMain.handle('system:info', async () => {
    try {
      return await systemService.getInfo()
    } catch (error) {
      log.error('system:info failed', error)
      throw error
    }
  })

  // CLI 버전 조회
  ipcMain.handle('system:version', async () => {
    try {
      return await systemService.getVersion()
    } catch (error) {
      log.error('system:version failed', error)
      throw error
    }
  })

  // 시스템 정리
  ipcMain.handle('system:prune', async (_, options?: { volumes?: boolean }) => {
    try {
      return await systemService.prune(options)
    } catch (error) {
      log.error('system:prune failed', error)
      throw error
    }
  })

  // 실시간 리소스 사용량 조회
  ipcMain.handle('system:resources', async () => {
    try {
      return await systemService.getResourceUsage()
    } catch (error) {
      log.error('system:resources failed', error)
      throw error
    }
  })

  log.info('System handlers registered')
}
