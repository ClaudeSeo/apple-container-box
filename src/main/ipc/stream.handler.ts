/**
 * Stream IPC 핸들러
 * 로그 스트리밍, exec 세션, stats 폴링 관리
 */

import { ipcMain, type IpcMainEvent } from 'electron'
import { randomUUID } from 'node:crypto'
import { streamService } from '../services/stream.service'
import { pollingService } from '../services/polling.service'
import { logger } from '../utils/logger'
import { assertTrustedIpcSender } from './security'

const log = logger.scope('StreamHandler')

function isTrustedStreamEvent(event: IpcMainEvent, channel: string): boolean {
  try {
    assertTrustedIpcSender(event, channel)
    return true
  } catch (error) {
    log.warn('Rejected untrusted stream event', { channel, error })
    return false
  }
}

export function registerStreamHandlers(): void {
  // 스트림 구독 시작
  ipcMain.on(
    'stream:subscribe',
    (event: IpcMainEvent, { type, containerId }: { type: 'logs' | 'stats'; containerId: string }) => {
      if (!isTrustedStreamEvent(event, 'stream:subscribe')) return
      log.debug('stream:subscribe', { type, containerId })

      if (type === 'logs') {
        void streamService.startLogStream(containerId, event.sender).catch((error) => {
          log.error('stream:subscribe logs failed', { containerId, error })
        })
      } else if (type === 'stats') {
        pollingService.startStatsPolling(containerId, event.sender)
      }
    }
  )

  // 스트림 구독 해제
  ipcMain.on(
    'stream:unsubscribe',
    (event: IpcMainEvent, { type, containerId }: { type: 'logs' | 'stats'; containerId: string }) => {
      if (!isTrustedStreamEvent(event, 'stream:unsubscribe')) return
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
      assertTrustedIpcSender(event, 'exec:start')
      const sessionId = `exec-${randomUUID()}`
      log.info('exec:start', { sessionId, containerId, command })

      await streamService.startExecSession(sessionId, containerId, event.sender, command)
      return { sessionId }
    }
  )

  // Exec 입력 전송
  ipcMain.on('exec:input', (event: IpcMainEvent, { sessionId, data }: { sessionId: string; data: string }) => {
    if (!isTrustedStreamEvent(event, 'exec:input')) return
    streamService.sendExecInput(sessionId, data, event.sender.id)
  })

  // Exec 세션 종료
  ipcMain.on('exec:close', (event: IpcMainEvent, { sessionId }: { sessionId: string }) => {
    if (!isTrustedStreamEvent(event, 'exec:close')) return
    log.debug('exec:close', { sessionId })
    streamService.stopExecSession(sessionId, event.sender.id)
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
