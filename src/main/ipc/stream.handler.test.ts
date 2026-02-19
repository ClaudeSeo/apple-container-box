import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  onHandlers,
  handleHandlers,
  ipcMainMock,
  startLogStreamMock,
  stopLogStreamMock,
  startExecSessionMock,
  stopExecSessionMock,
  sendExecInputMock,
  streamCleanupMock,
  startStatsPollingMock,
  stopStatsPollingMock,
  pollingCleanupMock
} = vi.hoisted(() => {
  const localOnHandlers = new Map<string, (...args: unknown[]) => unknown>()
  const localHandleHandlers = new Map<string, (...args: unknown[]) => unknown>()

  return {
    onHandlers: localOnHandlers,
    handleHandlers: localHandleHandlers,
    ipcMainMock: {
      on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        localOnHandlers.set(channel, handler)
      }),
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        localHandleHandlers.set(channel, handler)
      })
    },
    startLogStreamMock: vi.fn(),
    stopLogStreamMock: vi.fn(),
    startExecSessionMock: vi.fn(),
    stopExecSessionMock: vi.fn(),
    sendExecInputMock: vi.fn(),
    streamCleanupMock: vi.fn(),
    startStatsPollingMock: vi.fn(),
    stopStatsPollingMock: vi.fn(),
    pollingCleanupMock: vi.fn()
  }
})

vi.mock('electron', () => ({
  ipcMain: ipcMainMock
}))

vi.mock('../services/stream.service', () => ({
  streamService: {
    startLogStream: startLogStreamMock,
    stopLogStream: stopLogStreamMock,
    startExecSession: startExecSessionMock,
    stopExecSession: stopExecSessionMock,
    sendExecInput: sendExecInputMock,
    cleanup: streamCleanupMock
  }
}))

vi.mock('../services/polling.service', () => ({
  pollingService: {
    startStatsPolling: startStatsPollingMock,
    stopStatsPolling: stopStatsPollingMock,
    cleanup: pollingCleanupMock
  }
}))

vi.mock('../utils/logger', () => ({
  logger: {
    scope: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    })
  }
}))

import { cleanupStreams, registerStreamHandlers } from './stream.handler'

describe('stream.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onHandlers.clear()
    handleHandlers.clear()
  })

  it('registers stream handlers and routes subscribe/unsubscribe for stats', () => {
    registerStreamHandlers()

    const subscribe = onHandlers.get('stream:subscribe')
    const unsubscribe = onHandlers.get('stream:unsubscribe')
    expect(subscribe).toBeTypeOf('function')
    expect(unsubscribe).toBeTypeOf('function')

    const event = { sender: { id: 1 } }
    subscribe?.(event, { type: 'stats', containerId: 'c1' })
    expect(startStatsPollingMock).toHaveBeenCalledWith('c1', event.sender)

    unsubscribe?.({}, { type: 'stats', containerId: 'c1' })
    expect(stopStatsPollingMock).toHaveBeenCalledWith('c1')
  })

  it('routes log subscription and catches async start failures', async () => {
    registerStreamHandlers()
    startLogStreamMock.mockRejectedValue(new Error('log stream failed'))

    const subscribe = onHandlers.get('stream:subscribe')
    expect(() => subscribe?.({ sender: { id: 2 } }, { type: 'logs', containerId: 'c2' })).not.toThrow()

    await Promise.resolve()
    expect(startLogStreamMock).toHaveBeenCalledWith('c2', { id: 2 })
  })

  it('handles exec start/input/close lifecycle', async () => {
    registerStreamHandlers()
    startExecSessionMock.mockResolvedValue(undefined)

    const startHandler = handleHandlers.get('exec:start')
    const inputHandler = onHandlers.get('exec:input')
    const closeHandler = onHandlers.get('exec:close')

    const event = { sender: { id: 3 } }
    const result = await startHandler?.(event, { containerId: 'c3', command: ['/bin/sh'] })

    expect(result).toHaveProperty('sessionId')
    expect(startExecSessionMock).toHaveBeenCalled()

    const sessionId = (result as { sessionId: string }).sessionId
    inputHandler?.({}, { sessionId, data: 'ls\n' })
    closeHandler?.({}, { sessionId })

    expect(sendExecInputMock).toHaveBeenCalledWith(sessionId, 'ls\n')
    expect(stopExecSessionMock).toHaveBeenCalledWith(sessionId)
  })

  it('cleans up stream and polling services', () => {
    cleanupStreams()
    expect(streamCleanupMock).toHaveBeenCalled()
    expect(pollingCleanupMock).toHaveBeenCalled()
  })
})
