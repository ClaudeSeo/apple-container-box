/**
 * IPC 핸들러 모듈
 * 모든 핸들러를 등록하는 진입점
 */

import { registerContainerHandlers } from './container.handler'
import { registerImageHandlers } from './image.handler'
import { registerVolumeHandlers } from './volume.handler'
import { registerNetworkHandlers } from './network.handler'
import { registerSystemHandlers } from './system.handler'
import { registerSettingsHandlers } from './settings.handler'
import { registerWindowHandlers, setupWindowStateEvents } from './window.handler'
import { registerStreamHandlers, cleanupStreams } from './stream.handler'
import { logger } from '../utils/logger'

const log = logger.scope('IPC')

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers(): void {
  log.info('Registering all IPC handlers...')

  registerContainerHandlers()
  registerImageHandlers()
  registerVolumeHandlers()
  registerNetworkHandlers()
  registerSystemHandlers()
  registerSettingsHandlers()
  registerWindowHandlers()
  registerStreamHandlers()

  log.info('All IPC handlers registered')
}

export { setupWindowStateEvents, cleanupStreams }
