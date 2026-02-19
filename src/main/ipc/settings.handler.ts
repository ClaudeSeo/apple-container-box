/**
 * Settings IPC 핸들러
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import { settingsStore, type AppSettings } from '../store/settings.store'
import { logger } from '../utils/logger'
import { createTray, destroyTray, hasTray } from '../tray'
import { resetCLIAdapter } from '../cli'
import { resetAllServiceAdapters } from '../services'
import { assertTrustedIpcSender } from './security'

const log = logger.scope('SettingsHandler')

export function registerSettingsHandlers(): void {
  // 설정 조회
  ipcMain.handle('settings:get', async (event) => {
    try {
      assertTrustedIpcSender(event, 'settings:get')
      return settingsStore.get()
    } catch (error) {
      log.error('settings:get failed', error)
      throw error
    }
  })

  // 설정 업데이트
  ipcMain.handle('settings:set', async (event, settings: Partial<AppSettings>) => {
    try {
      assertTrustedIpcSender(event, 'settings:set')
      const previous = settingsStore.get()
      settingsStore.set(settings)
      const updated = settingsStore.get()

      applyRuntimeSettings(updated)

      const cliPathChanged =
        previous.cli.mode !== updated.cli.mode || previous.cli.customPath !== updated.cli.customPath
      if (cliPathChanged) {
        resetCLIAdapter()
        resetAllServiceAdapters()
      }

      notifySettingsChanged(updated)
      return updated
    } catch (error) {
      log.error('settings:set failed', error)
      throw error
    }
  })

  // 설정 초기화
  ipcMain.handle('settings:reset', async (event) => {
    try {
      assertTrustedIpcSender(event, 'settings:reset')
      const reset = settingsStore.reset()
      applyRuntimeSettings(reset)
      resetCLIAdapter()
      resetAllServiceAdapters()
      notifySettingsChanged(reset)
      return reset
    } catch (error) {
      log.error('settings:reset failed', error)
      throw error
    }
  })

  log.info('Settings handlers registered')
}

function applyRuntimeSettings(settings: AppSettings): void {
  app.setLoginItemSettings({ openAtLogin: settings.autoLaunch })

  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (settings.showTrayIcon && !hasTray()) {
    createTray(mainWindow)
    return
  }

  if (!settings.showTrayIcon && hasTray()) {
    destroyTray()
  }
}

function notifySettingsChanged(settings: AppSettings): void {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings:changed', settings)
  }
}
