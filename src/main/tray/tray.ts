/**
 * System Tray 관리
 * 메뉴바 트레이 아이콘 + 컨텍스트 메뉴
 */

import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { join } from 'path'
import { logger } from '../utils/logger'
import { APP_DISPLAY_NAME } from '../utils/constants'

const log = logger.scope('Tray')

/** 트레이 인스턴스 */
let tray: Tray | null = null

/** 현재 실행 중인 컨테이너 수 */
let runningCount = 0

/**
 * 트레이 아이콘 경로
 */
function getTrayIconPath(): string {
  // 개발 환경과 프로덕션 환경에서 경로가 다름
  const resourcesPath = app.isPackaged
    ? join(process.resourcesPath, 'resources')
    : join(__dirname, '../../resources')

  return join(resourcesPath, 'tray-icon.png')
}

/**
 * 트레이 생성
 */
export function createTray(mainWindow: BrowserWindow): Tray {
  if (tray) {
    return tray
  }

  log.info('Creating system tray')

  // 트레이 아이콘 생성 (16x16 또는 22x22 권장)
  const iconPath = getTrayIconPath()
  let icon: Electron.NativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
    // macOS에서 템플릿 이미지로 설정 (다크/라이트 모드 자동 대응)
    icon = icon.resize({ width: 16, height: 16 })
    if (process.platform === 'darwin') {
      icon.setTemplateImage(true)
    }
  } catch {
    // 아이콘 파일이 없으면 빈 이미지 사용
    log.warn('Tray icon not found, using empty image')
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip(APP_DISPLAY_NAME)

  // 컨텍스트 메뉴 설정
  updateTrayMenu(mainWindow)

  // 더블 클릭으로 윈도우 표시
  tray.on('double-click', () => {
    showMainWindow(mainWindow)
  })

  // macOS: 클릭으로 윈도우 표시
  if (process.platform === 'darwin') {
    tray.on('click', () => {
      showMainWindow(mainWindow)
    })
  }

  log.info('System tray created')
  return tray
}

/**
 * 트레이 메뉴 업데이트
 */
export function updateTrayMenu(mainWindow: BrowserWindow): void {
  if (!tray) return

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: `Open ${APP_DISPLAY_NAME}`,
      click: () => showMainWindow(mainWindow)
    },
    { type: 'separator' },
    {
      label: `Running Containers: ${runningCount}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quick Actions',
      submenu: [
        {
          label: 'Refresh Containers',
          click: () => {
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('tray:refresh')
            }
          }
        },
        {
          label: 'Stop All Containers',
          click: () => {
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('tray:stop-all')
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ]

  const contextMenu = Menu.buildFromTemplate(template)
  tray.setContextMenu(contextMenu)
}

/**
 * 실행 중인 컨테이너 수 업데이트
 */
export function updateRunningCount(count: number, mainWindow: BrowserWindow): void {
  runningCount = count
  updateTrayMenu(mainWindow)

  // 툴팁 업데이트
  if (tray) {
    const tooltip = count > 0
      ? `${APP_DISPLAY_NAME} - ${count} running`
      : APP_DISPLAY_NAME
    tray.setToolTip(tooltip)
  }
}

/**
 * 메인 윈도우 표시
 */
function showMainWindow(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()
}

/**
 * 트레이 제거
 */
export function destroyTray(): void {
  if (tray) {
    log.info('Destroying system tray')
    tray.destroy()
    tray = null
  }
}

/**
 * 트레이 존재 여부
 */
export function hasTray(): boolean {
  return tray !== null
}
