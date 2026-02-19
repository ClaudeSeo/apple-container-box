/**
 * Electron Main Process 엔트리포인트
 * BrowserWindow 생성, 보안 설정, 생명주기 관리
 */

import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initLogger, logger } from './utils/logger'
import {
  APP_DISPLAY_NAME,
  WINDOW_DEFAULT_WIDTH,
  WINDOW_DEFAULT_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_MIN_HEIGHT
} from './utils/constants'
import { registerAllHandlers, setupWindowStateEvents, cleanupStreams } from './ipc'
import { createTray, destroyTray, hasTray } from './tray'
import { settingsStore } from './store/settings.store'
import { setupApplicationMenu } from './menu/app-menu'

/** 메인 윈도우 참조 */
let mainWindow: BrowserWindow | null = null
let isQuitting = false

/** 앱 윈도우 생성 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: WINDOW_DEFAULT_WIDTH,
    height: WINDOW_DEFAULT_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    title: APP_DISPLAY_NAME,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 보안 설정
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // 윈도우 준비되면 표시 (깜빡임 방지)
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    logger.info('Main window shown')
  })

  // 윈도우 상태 이벤트 설정
  setupWindowStateEvents(mainWindow)

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return
    }

    const settings = settingsStore.get()
    if (settings.minimizeToTray && hasTray()) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 개발 환경: DevTools 열기
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // 개발 서버 또는 빌드된 파일 로드
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  logger.info('Window created')
}

/** Content Security Policy 설정 */
function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = is.dev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "connect-src 'self' ws://localhost:*",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'"
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'"
        ].join('; ')

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  logger.debug('CSP configured', { dev: is.dev })
}

/** 앱 초기화 */
app.whenReady().then(() => {
  // 로거 초기화
  initLogger()
  logger.info('App starting...')

  // 앱 이름 설정 (개발 모드에서 "Electron" 대신 표시)
  app.setName(APP_DISPLAY_NAME)

  // Electron 앱 ID 설정 (macOS)
  electronApp.setAppUserModelId('com.apple-container-box.app')

  // macOS Dock 아이콘 설정 (개발 모드에서도 적용)
  // 패키지 빌드: electron-builder가 .icns 처리 / 개발 모드: PNG 직접 사용
  if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
    app.dock.setIcon(join(__dirname, '../../resources/icon.png'))
  }

  // 개발 환경: F12로 DevTools 토글, Cmd+R로 새로고침
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // CSP 설정
  setupCSP()

  // IPC 핸들러 등록
  registerAllHandlers()

  // 윈도우 생성
  createWindow()

  if (mainWindow) {
    setupApplicationMenu(mainWindow)
  }

  // 런타임 설정 적용
  const settings = settingsStore.get()
  app.setLoginItemSettings({ openAtLogin: settings.autoLaunch })

  // 시스템 트레이 생성 (설정에 따라)
  if (settings.showTrayIcon && mainWindow) {
    createTray(mainWindow)
  }

  // macOS: dock 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      if (mainWindow) {
        setupApplicationMenu(mainWindow)
      }

      const nextSettings = settingsStore.get()
      if (nextSettings.showTrayIcon && mainWindow) {
        createTray(mainWindow)
      }
    }
  })
})

/** 모든 윈도우 닫힐 때 (macOS 제외) */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/** 앱 종료 전 정리 */
app.on('before-quit', () => {
  isQuitting = true
  logger.info('App quitting...')
  cleanupStreams()
  destroyTray()
})

/** 보안: 원격 모듈 비활성화 */
app.on('web-contents-created', (_, contents) => {
  // 네비게이션 제한
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'file:' && !is.dev) {
      event.preventDefault()
      logger.warn(`Navigation blocked: ${url}`)
    }
  })

  // 새 윈도우 생성 제한
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
