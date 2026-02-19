/**
 * 폴링 서비스
 * 컨테이너 목록 + Stats 주기적 업데이트
 */

import type { WebContents } from 'electron'
import { createCLIAdapter, type ContainerCLIAdapter } from '../cli'
import { logger } from '../utils/logger'
import { POLLING_INTERVAL_CONTAINER, POLLING_INTERVAL_STATS } from '../utils/constants'

const log = logger.scope('PollingService')

interface StatsSubscription {
  webContents: WebContents
  timer: NodeJS.Timeout
}

class PollingService {
  private adapter: ContainerCLIAdapter | null = null
  private containerPollingTimer: NodeJS.Timeout | null = null
  private containerPollingWebContents: WebContents | null = null
  private statsSubscriptions = new Map<string, StatsSubscription>()

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /**
   * 컨테이너 목록 폴링 시작
   */
  startContainerPolling(webContents: WebContents): void {
    // 기존 폴링 중지
    this.stopContainerPolling()

    log.info('Starting container polling', { interval: POLLING_INTERVAL_CONTAINER })
    this.containerPollingWebContents = webContents

    // 즉시 한 번 실행
    this.pollContainers()

    // 주기적 폴링
    this.containerPollingTimer = setInterval(() => {
      this.pollContainers()
    }, POLLING_INTERVAL_CONTAINER)
  }

  /**
   * 컨테이너 목록 폴링 실행
   */
  private async pollContainers(): Promise<void> {
    if (!this.containerPollingWebContents || this.containerPollingWebContents.isDestroyed()) {
      this.stopContainerPolling()
      return
    }

    try {
      const adapter = await this.getAdapter()
      const containers = await adapter.listContainers({ all: true })
      this.containerPollingWebContents.send('containers:updated', containers)
    } catch (error) {
      log.error('Container polling failed', error)
    }
  }

  /**
   * 컨테이너 목록 폴링 중지
   */
  stopContainerPolling(): void {
    if (this.containerPollingTimer) {
      log.info('Stopping container polling')
      clearInterval(this.containerPollingTimer)
      this.containerPollingTimer = null
      this.containerPollingWebContents = null
    }
  }

  /**
   * 컨테이너 Stats 폴링 시작
   */
  startStatsPolling(containerId: string, webContents: WebContents): void {
    // 기존 구독 중지
    if (this.statsSubscriptions.has(containerId)) {
      this.stopStatsPolling(containerId)
    }

    log.info('Starting stats polling', { containerId, interval: POLLING_INTERVAL_STATS })

    // 즉시 한 번 실행
    this.pollStats(containerId, webContents)

    // 주기적 폴링
    const timer = setInterval(() => {
      this.pollStats(containerId, webContents)
    }, POLLING_INTERVAL_STATS)

    this.statsSubscriptions.set(containerId, { webContents, timer })
  }

  /**
   * Stats 폴링 실행
   */
  private async pollStats(containerId: string, webContents: WebContents): Promise<void> {
    if (webContents.isDestroyed()) {
      this.stopStatsPolling(containerId)
      return
    }

    try {
      const adapter = await this.getAdapter()
      const stats = await adapter.getContainerStats(containerId)
      webContents.send(`container:stats:stream:${containerId}`, {
        cpuPercent: stats.cpuPercent,
        memoryUsage: stats.memoryUsage,
        memoryLimit: stats.memoryLimit,
        networkRx: stats.networkRx,
        networkTx: stats.networkTx,
        timestamp: stats.timestamp
      })
    } catch (error) {
      log.error('Stats polling failed', { containerId, error })
      // 에러 시 구독 중지
      this.stopStatsPolling(containerId)
    }
  }

  /**
   * 컨테이너 Stats 폴링 중지
   */
  stopStatsPolling(containerId: string): void {
    const subscription = this.statsSubscriptions.get(containerId)
    if (subscription) {
      log.info('Stopping stats polling', { containerId })
      clearInterval(subscription.timer)
      this.statsSubscriptions.delete(containerId)
    }
  }

  /**
   * 활성 Stats 구독 목록
   */
  getActiveStatsSubscriptions(): string[] {
    return Array.from(this.statsSubscriptions.keys())
  }

  /**
   * 모든 폴링 정리
   */
  cleanup(): void {
    log.info('Cleaning up all polling')
    this.stopContainerPolling()
    for (const containerId of this.statsSubscriptions.keys()) {
      this.stopStatsPolling(containerId)
    }
  }
}

export const pollingService = new PollingService()
