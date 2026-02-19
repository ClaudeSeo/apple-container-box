/**
 * Stream IPC 핸들러
 * 로그 스트리밍, exec 세션, stats 폴링 관리
 */

import { ipcMain, type IpcMainEvent } from 'electron'
import { streamService } from '../services/stream.service'
import { pollingService } from '../services/polling.service'
import { logger } from '../utils/logger'

const log = logger.scope('StreamHandler')

export function registerStreamHandlers(): void {
  // 스트림 구독 시작
  ipcMain.on(
    'stream:subscribe',
    (event: IpcMainEvent, { type, containerId }: { type: 'logs' | 'stats'; containerId: string }) => {
      log.debug('stream:subscribe', { type, containerId })

      if (type === 'logs') {
        streamService.startLogStream(containerId, event.sender)
      } else if (type === 'stats') {
        pollingService.startStatsPolling(containerId, event.sender)
      }
    }
  )

  // 스트림 구독 해제
  ipcMain.on(
    'stream:unsubscribe',
    (_event: IpcMainEvent, { type, containerId }: { type: 'logs' | 'stats'; containerId: string }) => {
      log.debug('stream:unsubscribe', { type, containerId })

      if (type === 'logs') {
        streamService.stopLogStream(containerId)
      } else if (type === 'stats') {
        pollingService.stopStatsPolling(containerId)
      }
    }
  )

  // Exec 세션 시작
  ipcMain.handle(
    'exec:start',
    async (
      event,
      { containerId, command }: { containerId: string; command?: string[] }
    ): Promise<{ sessionId: string }> => {
      const sessionId = `exec-${containerId}-${Date.now()}`
      log.info('exec:start', { sessionId, containerId, command })

      await streamService.startExecSession(sessionId, containerId, event.sender, command)
      return { sessionId }
    }
  )

  // Exec 입력 전송
  ipcMain.on('exec:input', (_event: IpcMainEvent, { sessionId, data }: { sessionId: string; data: string }) => {
    streamService.sendExecInput(sessionId, data)
  })

  // Exec 세션 종료
  ipcMain.on('exec:close', (_event: IpcMainEvent, { sessionId }: { sessionId: string }) => {
    log.debug('exec:close', { sessionId })
    streamService.stopExecSession(sessionId)
  })

  // 컨테이너 폴링 시작/중지
  ipcMain.on('polling:containers:start', (event: IpcMainEvent) => {
    log.debug('polling:containers:start')
    pollingService.startContainerPolling(event.sender)
  })

  ipcMain.on('polling:containers:stop', () => {
    log.debug('polling:containers:stop')
    pollingService.stopContainerPolling()
  })

  log.info('Stream handlers registered')
}

/**
 * 앱 종료 시 정리
 */
export function cleanupStreams(): void {
  log.info('Cleaning up streams')
  streamService.cleanup()
  pollingService.cleanup()
}
