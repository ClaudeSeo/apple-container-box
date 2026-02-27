import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOG_BUFFER_MAX_LINES } from '../utils/constants'
import { POLLING_INTERVAL_STATS } from '../utils/constants'

const { createCLIAdapterMock, isMockModeMock } = vi.hoisted(() => ({
  createCLIAdapterMock: vi.fn(),
  isMockModeMock: vi.fn(() => false)
}))

vi.mock('../cli', () => ({
  createCLIAdapter: createCLIAdapterMock,
  isMockMode: isMockModeMock
}))

vi.mock('node-pty', () => ({
  spawn: vi.fn()
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

import * as pty from 'node-pty'
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

  it('propagates exec session spawn failures when pty.spawn throws', async () => {
    const webContents = createWebContentsMock()
    isMockModeMock.mockReturnValue(false)
    createCLIAdapterMock.mockResolvedValue({
      getCLIPath: vi.fn().mockResolvedValue('/usr/local/bin/container')
    })
    vi.mocked(pty.spawn).mockImplementation(() => {
      throw new Error('pty spawn failed')
    })

    await expect(
      streamService.startExecSession('session-1', 'c1', webContents as never)
    ).rejects.toThrow('pty spawn failed')

    expect(webContents.send).toHaveBeenCalledWith('exec:error:session-1', {
      message: 'pty spawn failed'
    })
  })

  it('accepts exec input/close only from the owner renderer (mock mode)', async () => {
    const writeStub = vi.fn()
    const killStub = vi.fn()

    const mockPtyProcess = {
      onData: vi.fn(),
      onExit: vi.fn(),
      write: writeStub,
      resize: vi.fn(),
      kill: killStub,
      pid: 999,
      cols: 80,
      rows: 24,
      process: '',
      handleFlowControl: false,
      pause: vi.fn(),
      resume: vi.fn(),
      clear: vi.fn()
    }

    isMockModeMock.mockReturnValue(false)
    createCLIAdapterMock.mockResolvedValue({
      getCLIPath: vi.fn().mockResolvedValue('/usr/local/bin/container')
    })
    vi.mocked(pty.spawn).mockReturnValue(mockPtyProcess as unknown as pty.IPty)

    const ownerWebContents = createWebContentsMock(11)
    await streamService.startExecSession('session-owner', 'c1', ownerWebContents as never)

    streamService.sendExecInput('session-owner', 'pwd\n', 99)
    expect(writeStub).not.toHaveBeenCalled()

    streamService.sendExecInput('session-owner', 'pwd\n', 11)
    expect(writeStub).toHaveBeenCalledWith('pwd\n')

    streamService.stopExecSession('session-owner', 99)
    expect(killStub).not.toHaveBeenCalled()

    streamService.stopExecSession('session-owner', 11)
    expect(killStub).toHaveBeenCalledTimes(1)
  })

  it('resizes the pty session and rejects from non-owner', async () => {
    const resizeStub = vi.fn()

    const mockPtyProcess = {
      onData: vi.fn(),
      onExit: vi.fn(),
      write: vi.fn(),
      resize: resizeStub,
      kill: vi.fn(),
      pid: 999,
      cols: 80,
      rows: 24,
      process: '',
      handleFlowControl: false,
      pause: vi.fn(),
      resume: vi.fn(),
      clear: vi.fn()
    }

    isMockModeMock.mockReturnValue(false)
    createCLIAdapterMock.mockResolvedValue({
      getCLIPath: vi.fn().mockResolvedValue('/usr/local/bin/container')
    })
    vi.mocked(pty.spawn).mockReturnValue(mockPtyProcess as unknown as pty.IPty)

    const ownerWebContents = createWebContentsMock(22)
    await streamService.startExecSession('session-resize', 'c1', ownerWebContents as never)

    // non-owner → reject
    streamService.resizeExecSession('session-resize', 120, 40, 99)
    expect(resizeStub).not.toHaveBeenCalled()

    // owner → accept
    streamService.resizeExecSession('session-resize', 120, 40, 22)
    expect(resizeStub).toHaveBeenCalledWith(120, 40)
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

  it('runs first stats poll immediately on start', async () => {
    vi.useFakeTimers()
    try {
      const getContainerStats = vi.fn().mockResolvedValue({
        cpuPercent: 1,
        memoryUsage: 2,
        memoryLimit: 3,
        networkRx: 4,
        networkTx: 5,
        timestamp: Date.now()
      })

      createCLIAdapterMock.mockResolvedValue({
        getContainerStats
      })

      const webContents = createWebContentsMock()
      pollingService.startStatsPolling('c-immediate', webContents as never)

      await Promise.resolve()
      await Promise.resolve()

      expect(getContainerStats).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_STATS - 1)
      expect(getContainerStats).toHaveBeenCalledTimes(1)
    } finally {
      pollingService.cleanup()
      vi.useRealTimers()
    }
  })
})
