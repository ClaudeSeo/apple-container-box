import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOG_BUFFER_MAX_LINES } from '../utils/constants'
import { POLLING_INTERVAL_STATS } from '../utils/constants'

const { createCLIAdapterMock } = vi.hoisted(() => ({
  createCLIAdapterMock: vi.fn()
}))

vi.mock('../cli', () => ({
  createCLIAdapter: createCLIAdapterMock
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

import { streamService } from './stream.service'
import { pollingService } from './polling.service'

function createWebContentsMock(id = 1) {
  return {
    id,
    isDestroyed: vi.fn(() => false),
    send: vi.fn()
  }
}

describe('streamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamService.cleanup()
    streamService.resetAdapter()
    pollingService.cleanup()
    pollingService.resetAdapter()
  })

  it('propagates log stream spawn failures to renderer error channel', async () => {
    const webContents = createWebContentsMock()
    createCLIAdapterMock.mockResolvedValue({
      spawnContainerLogs: vi.fn(() => {
        throw new Error('spawn logs failed')
      })
    })

    await expect(streamService.startLogStream('c1', webContents as never)).rejects.toThrow(
      'spawn logs failed'
    )

    expect(webContents.send).toHaveBeenCalledWith('container:logs:stream:c1:error', {
      message: 'spawn logs failed'
    })
  })

  it('propagates exec session spawn failures to renderer error channel', async () => {
    const webContents = createWebContentsMock()
    createCLIAdapterMock.mockResolvedValue({
      spawnContainerExec: vi.fn(() => {
        throw new Error('spawn exec failed')
      })
    })

    await expect(
      streamService.startExecSession('session-1', 'c1', webContents as never)
    ).rejects.toThrow('spawn exec failed')

    expect(webContents.send).toHaveBeenCalledWith('exec:error:session-1', {
      message: 'spawn exec failed'
    })
  })

  it('accepts exec input/close only from the owner renderer', async () => {
    const stdinWrite = vi.fn()
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter
      stderr: EventEmitter
      stdin: { write: (data: string) => void }
      kill: () => void
    }
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    proc.stdin = { write: stdinWrite }
    proc.kill = vi.fn()

    createCLIAdapterMock.mockResolvedValue({
      spawnContainerExec: vi.fn(() => proc)
    })

    const ownerWebContents = createWebContentsMock(11)
    await streamService.startExecSession('session-owner', 'c1', ownerWebContents as never)

    streamService.sendExecInput('session-owner', 'pwd\n', 99)
    expect(stdinWrite).not.toHaveBeenCalled()

    streamService.sendExecInput('session-owner', 'pwd\n', 11)
    expect(stdinWrite).toHaveBeenCalledWith('pwd\n')

    streamService.stopExecSession('session-owner', 99)
    expect(proc.kill).not.toHaveBeenCalled()

    streamService.stopExecSession('session-owner', 11)
    expect(proc.kill).toHaveBeenCalledTimes(1)
  })

  it('starts a log stream and emits buffered output', async () => {
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter
      stderr: EventEmitter
      kill: () => void
    }
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    proc.kill = vi.fn()

    const webContents = createWebContentsMock()
    createCLIAdapterMock.mockResolvedValue({
      spawnContainerLogs: vi.fn(() => proc)
    })

    await streamService.startLogStream('c2', webContents as never)
    proc.stdout.emit('data', Buffer.from('hello'))

    await new Promise((resolve) => setTimeout(resolve, 130))

    expect(webContents.send).toHaveBeenCalledWith('container:logs:stream:c2', { line: 'hello' })
  })

  it('caps buffered log chunks to prevent unbounded growth', async () => {
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter
      stderr: EventEmitter
      kill: () => void
    }
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    proc.kill = vi.fn()

    const webContents = createWebContentsMock()
    createCLIAdapterMock.mockResolvedValue({
      spawnContainerLogs: vi.fn(() => proc)
    })

    await streamService.startLogStream('c3', webContents as never)

    for (let i = 0; i < LOG_BUFFER_MAX_LINES + 5; i += 1) {
      proc.stdout.emit('data', Buffer.from(`${i}|`))
    }

    await new Promise((resolve) => setTimeout(resolve, 130))

    const sendCalls = vi.mocked(webContents.send).mock.calls
    const streamed = sendCalls.find(([channel]) => channel === 'container:logs:stream:c3')
    expect(streamed).toBeDefined()
    const firstChunk = (streamed?.[1] as { line: string }).line.split('|')[0]
    expect(firstChunk).toBe('5')
  })

  it('does not overlap stats requests when previous poll is still in-flight', async () => {
    vi.useFakeTimers()
    try {
      let resolveStats: (() => void) | undefined
      const statsGate = new Promise<void>((resolve) => {
        resolveStats = resolve
      })

      const getContainerStats = vi.fn().mockImplementation(async () => {
        await statsGate
        return {
          cpuPercent: 1,
          memoryUsage: 2,
          memoryLimit: 3,
          networkRx: 4,
          networkTx: 5,
          timestamp: Date.now()
        }
      })

      createCLIAdapterMock.mockResolvedValue({
        getContainerStats
      })

      const webContents = createWebContentsMock()
      pollingService.startStatsPolling('c1', webContents as never)

      await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_STATS * 3)
      expect(getContainerStats).toHaveBeenCalledTimes(1)

      resolveStats?.()
      await Promise.resolve()
    } finally {
      pollingService.cleanup()
      vi.useRealTimers()
    }
  })
})
