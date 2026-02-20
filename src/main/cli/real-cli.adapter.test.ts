import { describe, expect, it, vi } from 'vitest'
import { CLI_TIMEOUT_LONG } from '../utils/constants'
import { RealContainerCLI } from './real-cli.adapter'

describe('RealContainerCLI', () => {
  it('uses create command only when runContainer start is false', async () => {
    const cli = new RealContainerCLI('/tmp/fake-container')
    const execMock = vi.fn().mockResolvedValue('created-id')
    Reflect.set(cli as object, 'exec', execMock)

    await expect(cli.runContainer({ image: 'nginx:latest', start: false })).resolves.toEqual({
      id: 'created-id'
    })

    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(['create', 'nginx:latest'], CLI_TIMEOUT_LONG)
  })

  it('does not fallback to run+stop when create command fails', async () => {
    const cli = new RealContainerCLI('/tmp/fake-container')
    const execMock = vi.fn().mockRejectedValue(new Error('create failed'))
    Reflect.set(cli as object, 'exec', execMock)

    await expect(cli.runContainer({ image: 'nginx:latest', start: false })).rejects.toThrow(
      'create failed'
    )

    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(['create', 'nginx:latest'], CLI_TIMEOUT_LONG)
  })

  it('connects and disconnects a container to network via CLI args', async () => {
    const cli = new RealContainerCLI('/tmp/fake-container')
    const execMock = vi.fn().mockResolvedValue('')
    Reflect.set(cli as object, 'exec', execMock)

    await cli.connectNetwork('backend', 'a1b2c3d4e5f6', {
      ip: '192.168.66.20',
      alias: ['api', 'app']
    })
    await cli.disconnectNetwork('backend', 'a1b2c3d4e5f6', true)

    expect(execMock).toHaveBeenNthCalledWith(1, [
      'network',
      'connect',
      '--ip',
      '192.168.66.20',
      '--alias',
      'api,app',
      'backend',
      'a1b2c3d4e5f6'
    ])
    expect(execMock).toHaveBeenNthCalledWith(2, [
      'network',
      'disconnect',
      '--force',
      'backend',
      'a1b2c3d4e5f6'
    ])
  })

  it('computes cpuPercent from cpuUsageUsec delta when stats output has no cpu field', async () => {
    const cli = new RealContainerCLI('/tmp/fake-container')
    const execMock = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            id: 'nginx-container',
            cpuUsageUsec: 100000,
            memoryUsageBytes: 22097920,
            memoryLimitBytes: 1073741824,
            networkRxBytes: 1000,
            networkTxBytes: 100
          }
        ])
      )
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            id: 'nginx-container',
            cpuUsageUsec: 150000,
            memoryUsageBytes: 22097920,
            memoryLimitBytes: 1073741824,
            networkRxBytes: 1100,
            networkTxBytes: 200
          }
        ])
      )
    Reflect.set(cli as object, 'exec', execMock)

    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(2000)

    const first = await cli.getContainerStats('nginx-container')
    const second = await cli.getContainerStats('nginx-container')

    expect(first.cpuPercent).toBe(0)
    expect(second.cpuPercent).toBeCloseTo(5, 5)
  })
})
