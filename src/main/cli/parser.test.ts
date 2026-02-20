import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseContainerStats } from './parser'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseContainerStats', () => {
  it('parses Apple container stats array schema', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

    const output = JSON.stringify([
      {
        blockWriteBytes: 4096,
        numProcesses: 7,
        cpuUsageUsec: 40855,
        networkRxBytes: 234335,
        blockReadBytes: 16392192,
        networkTxBytes: 602,
        memoryUsageBytes: 22097920,
        id: 'nginx-container',
        memoryLimitBytes: 1073741824
      }
    ])

    const result = parseContainerStats(output, 'nginx-container')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      containerId: 'nginx-container',
      cpuPercent: 0,
      memoryUsage: 22097920,
      memoryLimit: 1073741824,
      networkRx: 234335,
      networkTx: 602,
      blockRead: 16392192,
      blockWrite: 4096,
      timestamp: 1700000000000
    })
  })

  it('keeps backward compatibility for legacy schema', () => {
    const output = JSON.stringify({
      cpu: 12.5,
      memory: { usage: 1024, limit: 4096 },
      network: { rx: 100, tx: 50 },
      block: { read: 10, write: 20 }
    })

    const result = parseContainerStats(output, 'legacy-container')
    expect(result.success).toBe(true)
    expect(result.data?.cpuPercent).toBe(12.5)
    expect(result.data?.memoryUsage).toBe(1024)
    expect(result.data?.memoryLimit).toBe(4096)
    expect(result.data?.networkRx).toBe(100)
    expect(result.data?.networkTx).toBe(50)
    expect(result.data?.blockRead).toBe(10)
    expect(result.data?.blockWrite).toBe(20)
  })
})
