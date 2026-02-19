/**
 * Network 서비스
 * Network 관련 비즈니스 로직
 */

import { createCLIAdapter, type ContainerCLIAdapter } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('NetworkService')

class NetworkService {
  private adapter: ContainerCLIAdapter | null = null

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /** 네트워크 목록 조회 */
  async listNetworks() {
    log.debug('listNetworks')
    const adapter = await this.getAdapter()
    return adapter.listNetworks()
  }

  /** 네트워크 생성 */
  async createNetwork(name: string, driver?: string, subnet?: string) {
    log.info('createNetwork', { name, driver, subnet })
    const adapter = await this.getAdapter()
    return adapter.createNetwork(name, driver, subnet)
  }

  /** 네트워크 삭제 */
  async deleteNetwork(id: string, force?: boolean) {
    log.info('deleteNetwork', { id, force })
    const adapter = await this.getAdapter()
    return adapter.deleteNetwork(id, force)
  }

  /** 네트워크 상세 조회 */
  async inspectNetwork(id: string) {
    log.debug('inspectNetwork', { id })
    const adapter = await this.getAdapter()
    return adapter.inspectNetwork(id)
  }

  /** 네트워크에 컨테이너 연결 (CLI 레벨에서 직접 구현 필요) */
  async connectContainer(network: string, container: string, options?: { ip?: string; alias?: string[] }) {
    log.info('connectContainer', { network, container, ...options })
    // RealContainerCLI에 connect 메서드 추가 필요
    // 현재는 placeholder
    throw new Error('Not implemented yet')
  }

  /** 네트워크에서 컨테이너 분리 */
  async disconnectContainer(network: string, container: string, force?: boolean) {
    log.info('disconnectContainer', { network, container, force })
    // RealContainerCLI에 disconnect 메서드 추가 필요
    throw new Error('Not implemented yet')
  }
}

export const networkService = new NetworkService()
