import { app, BrowserWindow, Menu, dialog, shell } from 'electron'
import { join } from 'path'
import { APP_DISPLAY_NAME, APP_NAME } from '../utils/constants'

const DOCS_URL = 'https://apple.github.io/container/documentation/'

export function setupApplicationMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const appMenu: Electron.MenuItemConstructorOptions = {
    label: APP_DISPLAY_NAME,
    submenu: [
      {
        label: `About ${APP_DISPLAY_NAME}`,
        click: () => {
          void showAboutDialog(mainWindow)
        }
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [appMenu] : []),
    {
      role: 'help',
      submenu: [
        {
          label: 'Apple Container Docs',
          click: async () => {
            await shell.openExternal(DOCS_URL)
          }
        },
        {
          label: 'Reveal Logs Folder',
          click: async () => {
            const logFile = join(app.getPath('userData'), 'logs', `${APP_NAME}.log`)
            await shell.showItemInFolder(logFile)
          }
        },
        {
          label: `About ${APP_DISPLAY_NAME}`,
          click: () => {
            void showAboutDialog(mainWindow)
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

async function showAboutDialog(mainWindow: BrowserWindow): Promise<void> {
  await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: `About ${APP_DISPLAY_NAME}`,
    message: APP_DISPLAY_NAME,
    detail: `Version ${app.getVersion()}`,
    buttons: ['OK']
  })
}
