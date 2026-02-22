import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseContainerStats, parsePullProgress, parseBuildProgress, stripAnsi } from './parser'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parsePullProgress', () => {
  it('Docker layer ID가 있는 경우 layerId를 추출하고 complete 처리', () => {
    // 8자 이상의 hex 문자열을 layer ID로 인식
    const result = parsePullProgress('abc12345: Pull complete')
    expect(result).toMatchObject({
      phase: 'complete',
      percent: 100,
      layerId: 'abc12345',
    })
  })

  it('바이트 진행률 패턴을 파싱하여 current/total/percent 계산', () => {
    // 45 MB / 120 MB → percent = Math.round(45/120 * 100) = 38
    const result = parsePullProgress('Downloading 45 MB / 120 MB')
    expect(result).toMatchObject({
      phase: 'downloading',
      current: 45 * 1024 * 1024,
      total: 120 * 1024 * 1024,
      percent: 38,
    })
  })

  it('퍼센트 직접 추출 패턴 처리', () => {
    const result = parsePullProgress('Pulling... 45%')
    expect(result).toMatchObject({
      phase: 'downloading',
      percent: 45,
    })
  })

  it('키워드 fallback: pull → resolving, percent=5', () => {
    const result = parsePullProgress('Pulling from library/nginx')
    expect(result).toMatchObject({
      phase: 'resolving',
      percent: 5,
    })
  })

  it('키워드 fallback: complete → phase=complete, percent=100', () => {
    const result = parsePullProgress('Pull complete')
    expect(result).toMatchObject({
      phase: 'complete',
      percent: 100,
    })
  })

  it('에러 키워드 → phase=error, percent=0', () => {
    const result = parsePullProgress('Error: manifest unknown')
    expect(result).toMatchObject({
      phase: 'error',
      percent: 0,
    })
  })

  it('알 수 없는 텍스트 → resolving fallback', () => {
    // 어떤 키워드도 매칭되지 않으면 기본 phase=resolving, percent=5
    const result = parsePullProgress('some random text')
    expect(result).toMatchObject({
      phase: 'resolving',
      percent: 5,
    })
  })

  it('extracting 키워드 인식', () => {
    const result = parsePullProgress('Extracting layer data')
    expect(result).toMatchObject({
      phase: 'extracting',
      percent: 70,
    })
  })

  it('verifying 키워드 인식', () => {
    const result = parsePullProgress('Verifying Checksum')
    expect(result).toMatchObject({
      phase: 'verifying',
      percent: 90,
    })
  })

  it('fail 키워드 → phase=error', () => {
    const result = parsePullProgress('failed to pull image')
    expect(result).toMatchObject({
      phase: 'error',
      percent: 0,
    })
  })
})

describe('parseBuildProgress', () => {
  it('Step N/M 패턴: 첫 번째 스텝 파싱', () => {
    // Math.round(1/3 * 100) = 33
    const result = parseBuildProgress('Step 1/3: FROM alpine')
    expect(result).toMatchObject({
      phase: 'extracting',
      step: 1,
      totalSteps: 3,
      percent: 33,
    })
  })

  it('Step N/M 패턴: 중간 스텝 파싱', () => {
    // Math.round(2/3 * 100) = 67
    const result = parseBuildProgress('Step 2/3: RUN echo hello')
    expect(result).toMatchObject({
      step: 2,
      totalSteps: 3,
      percent: 67,
    })
  })

  it('Step N/M 패턴: 마지막 스텝은 percent=100 아님 (complete 전)', () => {
    // Math.round(3/3 * 100) = 100 이지만 "Successfully built"가 아니면 extracting
    const result = parseBuildProgress('Step 3/3: CMD ["sh"]')
    expect(result).toMatchObject({
      step: 3,
      totalSteps: 3,
      percent: 100,
      phase: 'extracting',
    })
  })

  it('Successfully built → phase=complete, percent=100', () => {
    const result = parseBuildProgress('Successfully built sha256:abc123')
    expect(result).toMatchObject({
      phase: 'complete',
      percent: 100,
    })
  })

  it('에러 키워드 → phase=error, percent=0', () => {
    const result = parseBuildProgress('Error: failed to build')
    expect(result).toMatchObject({
      phase: 'error',
      percent: 0,
    })
  })

  it('알 수 없는 텍스트 → extracting fallback', () => {
    const result = parseBuildProgress('some unknown output')
    expect(result).toMatchObject({
      phase: 'extracting',
      percent: 0,
    })
  })

  it('fail 키워드 → phase=error', () => {
    const result = parseBuildProgress('Build FAILED')
    expect(result).toMatchObject({
      phase: 'error',
      percent: 0,
    })
  })
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

describe('stripAnsi', () => {
  it('ANSI escape sequence 제거', () => {
    expect(stripAnsi('\x1b[2KDownloading 50%')).toBe('Downloading 50%')
  })

  it('plain text는 그대로 반환', () => {
    expect(stripAnsi('Pull complete')).toBe('Pull complete')
  })

  it('복수의 ANSI 시퀀스 제거', () => {
    expect(stripAnsi('\x1b[0m\x1b[32mDone\x1b[0m')).toBe('Done')
  })
})
