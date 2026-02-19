import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

function createWebContentsMock() {
  return {
    isDestroyed: vi.fn(() => false),
    send: vi.fn()
  }
}

describe('streamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamService.cleanup()
    streamService.resetAdapter()
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
})
