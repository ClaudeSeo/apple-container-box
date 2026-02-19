/**
 * Container 서비스
 * Container 관련 비즈니스 로직
 */

import { createCLIAdapter, type ContainerCLIAdapter, type ContainerRunOptions } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('ContainerService')

class ContainerService {
  private adapter: ContainerCLIAdapter | null = null

  resetAdapter(): void {
    this.adapter = null
  }

  /** 어댑터 초기화 */
  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 컨테이너 목록 조회 */
  async listContainers(options?: { all?: boolean }) {
    log.debug('listContainers', options)
    const adapter = await this.getAdapter()
    return adapter.listContainers(options)
  }

  /** 컨테이너 실행 */
  async runContainer(options: ContainerRunOptions) {
    log.info('runContainer', { image: options.image, name: options.name })
    const adapter = await this.getAdapter()
    return adapter.runContainer(options)
  }

  /** 컨테이너 중지 */
  async stopContainer(id: string, timeout?: number) {
    log.info('stopContainer', { id, timeout })
    const adapter = await this.getAdapter()
    return adapter.stopContainer(id, timeout)
  }

  /** 컨테이너 시작 */
  async startContainer(id: string) {
    log.info('startContainer', { id })
    const adapter = await this.getAdapter()
    return adapter.startContainer(id)
  }

  /** 컨테이너 재시작 */
  async restartContainer(id: string, timeout?: number) {
    log.info('restartContainer', { id, timeout })
    const adapter = await this.getAdapter()
    return adapter.restartContainer(id, timeout)
  }

  /** 컨테이너 삭제 */
  async deleteContainer(id: string, force?: boolean) {
    log.info('deleteContainer', { id, force })
    const adapter = await this.getAdapter()
    return adapter.deleteContainer(id, force)
  }

  /** 컨테이너 상세 조회 */
  async inspectContainer(id: string) {
    log.debug('inspectContainer', { id })
    const adapter = await this.getAdapter()
    return adapter.inspectContainer(id)
  }

  /** 컨테이너 stats 조회 */
  async getContainerStats(id: string) {
    const adapter = await this.getAdapter()
    return adapter.getContainerStats(id)
  }

  /** 컨테이너 로그 조회 (일회성) */
  async getContainerLogs(id: string, options?: { tail?: number; timestamps?: boolean }) {
    log.debug('getContainerLogs', { id, ...options })
    const adapter = await this.getAdapter()
    const proc = adapter.spawnContainerLogs(id, { tail: options?.tail || 100, follow: false })

    return new Promise<string>((resolve, reject) => {
      let output = ''
      proc.stdout?.on('data', (data: Buffer) => {
        output += data.toString()
      })
      proc.stderr?.on('data', (data: Buffer) => {
        output += data.toString()
      })
      proc.on('close', (code) => {
        if (code === 0 || output) {
          resolve(output)
        } else {
          reject(new Error(`Failed to get logs for container ${id}`))
        }
      })
      proc.on('error', reject)
    })
  }

  /** 컨테이너 exec 실행 (일회성) */
  async execInContainer(id: string, command: string[]) {
    log.info('execInContainer', { id, command })
    const adapter = await this.getAdapter()
    const proc = adapter.spawnContainerExec(id, command)

    return new Promise<{ output: string }>((resolve, reject) => {
      let output = ''
      proc.stdout?.on('data', (data: Buffer) => {
        output += data.toString()
      })
      proc.stderr?.on('data', (data: Buffer) => {
        output += data.toString()
      })
      proc.on('close', () => {
        resolve({ output })
      })
      proc.on('error', reject)
    })
  }
}

export const containerService = new ContainerService()
