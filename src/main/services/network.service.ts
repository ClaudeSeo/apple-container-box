/**
 * Network 서비스
 * Network 관련 비즈니스 로직
 */

import { createCLIAdapter, type ContainerCLIAdapter, validateContainerId, validateName } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('NetworkService')

class NetworkService {
  private adapter: ContainerCLIAdapter | null = null

  resetAdapter(): void {
    this.adapter = null
  }

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
    validateName(id, 'network')
    const adapter = await this.getAdapter()
    return adapter.deleteNetwork(id, force)
  }

  /** 네트워크 상세 조회 */
  async inspectNetwork(id: string) {
    log.debug('inspectNetwork', { id })
    validateName(id, 'network')
    const adapter = await this.getAdapter()
    return adapter.inspectNetwork(id)
  }

  /** 네트워크에 컨테이너 연결 */
  async connectContainer(
    network: string,
    container: string,
    options?: { ip?: string; alias?: string[] }
  ) {
    log.info('connectContainer', { network, container, ...options })
    validateName(network, 'network')
    validateContainerId(container)
    const adapter = await this.getAdapter()
    return adapter.connectNetwork(network, container, options)
  }

  /** 네트워크에서 컨테이너 분리 */
  async disconnectContainer(network: string, container: string, force?: boolean) {
    log.info('disconnectContainer', { network, container, force })
    validateName(network, 'network')
    validateContainerId(container)
    const adapter = await this.getAdapter()
    return adapter.disconnectNetwork(network, container, force)
  }
}

export const networkService = new NetworkService()
