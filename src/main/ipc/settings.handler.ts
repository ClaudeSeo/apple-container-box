/**
 * Settings IPC 핸들러
 */

import { ipcMain } from 'electron'
import { settingsStore, type AppSettings } from '../store/settings.store'
import { logger } from '../utils/logger'

const log = logger.scope('SettingsHandler')

export function registerSettingsHandlers(): void {
  // 설정 조회
  ipcMain.handle('settings:get', async () => {
    try {
      return settingsStore.get()
    } catch (error) {
      log.error('settings:get failed', error)
      throw error
    }
  })

  // 설정 업데이트
  ipcMain.handle('settings:set', async (_, settings: Partial<AppSettings>) => {
    try {
      settingsStore.set(settings)
      return settingsStore.get()
    } catch (error) {
      log.error('settings:set failed', error)
      throw error
    }
  })

  // 설정 초기화
  ipcMain.handle('settings:reset', async () => {
    try {
      return settingsStore.reset()
    } catch (error) {
      log.error('settings:reset failed', error)
      throw error
    }
  })

  log.info('Settings handlers registered')
}
