/**
 * Window IPC 핸들러
 */

import { ipcMain, BrowserWindow } from 'electron'
import { logger } from '../utils/logger'

const log = logger.scope('WindowHandler')

export function registerWindowHandlers(): void {
  // 윈도우 최소화
  ipcMain.handle('window:minimize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  // 윈도우 최대화/복원 토글
  ipcMain.handle('window:maximize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  // 윈도우 닫기
  ipcMain.handle('window:close', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })

  // 윈도우 최대화 상태 확인
  ipcMain.handle('window:isMaximized', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isMaximized() ?? false
  })

  log.info('Window handlers registered')
}

/**
 * 윈도우 상태 변경 이벤트 설정
 */
export function setupWindowStateEvents(window: BrowserWindow): void {
  const sendState = () => {
    if (!window.isDestroyed()) {
      window.webContents.send('window:state-change', {
        maximized: window.isMaximized()
      })
    }
  }

  window.on('maximize', sendState)
  window.on('unmaximize', sendState)
}
