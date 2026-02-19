/**
 * Network IPC 핸들러
 */

import { ipcMain } from 'electron'
import { networkService } from '../services/network.service'
import { validateName, ValidationError } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('NetworkHandler')

export function registerNetworkHandlers(): void {
  // 네트워크 목록 조회
  ipcMain.handle('network:list', async () => {
    try {
      return await networkService.listNetworks()
    } catch (error) {
      log.error('network:list failed', error)
      throw error
    }
  })

  // 네트워크 생성
  ipcMain.handle(
    'network:create',
    async (_, { name, driver, subnet }: { name: string; driver?: string; subnet?: string }) => {
      try {
        validateName(name, 'network')
        return await networkService.createNetwork(name, driver, subnet)
      } catch (error) {
        log.error('network:create failed', error)
        if (error instanceof ValidationError) {
          throw new Error(`Validation error: ${error.message}`)
        }
        throw error
      }
    }
  )

  // 네트워크 삭제
  ipcMain.handle(
    'network:remove',
    async (_, { id, force }: { id: string; force?: boolean }) => {
      try {
        return await networkService.deleteNetwork(id, force)
      } catch (error) {
        log.error('network:remove failed', error)
        throw error
      }
    }
  )

  // 네트워크 상세 조회
  ipcMain.handle('network:inspect', async (_, { id }: { id: string }) => {
    try {
      return await networkService.inspectNetwork(id)
    } catch (error) {
      log.error('network:inspect failed', error)
      throw error
    }
  })

  // 네트워크에 컨테이너 연결
  ipcMain.handle(
    'network:connect',
    async (
      _,
      {
        network,
        container,
        ip,
        alias
      }: { network: string; container: string; ip?: string; alias?: string[] }
    ) => {
      try {
        return await networkService.connectContainer(network, container, { ip, alias })
      } catch (error) {
        log.error('network:connect failed', error)
        throw error
      }
    }
  )

  // 네트워크에서 컨테이너 분리
  ipcMain.handle(
    'network:disconnect',
    async (
      _,
      { network, container, force }: { network: string; container: string; force?: boolean }
    ) => {
      try {
        return await networkService.disconnectContainer(network, container, force)
      } catch (error) {
        log.error('network:disconnect failed', error)
        throw error
      }
    }
  )

  log.info('Network handlers registered')
}
