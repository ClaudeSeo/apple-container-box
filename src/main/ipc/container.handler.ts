/**
 * Container IPC 핸들러
 */

import { ipcMain } from 'electron'
import { containerService } from '../services/container.service'
import { validateContainerId, validateImageRef, validateName, ValidationError } from '../cli'
import { logger } from '../utils/logger'
import { assertTrustedIpcSender } from './security'

const log = logger.scope('ContainerHandler')

export function registerContainerHandlers(): void {
  // 컨테이너 목록 조회
  ipcMain.handle('container:list', async (event, options?: { all?: boolean }) => {
    try {
      assertTrustedIpcSender(event, 'container:list')
      return await containerService.listContainers(options)
    } catch (error) {
      log.error('container:list failed', error)
      throw error
    }
  })

  // 컨테이너 실행
  ipcMain.handle(
    'container:run',
    async (
      event,
      options: {
        image: string
        name?: string
        ports?: string[]
        volumes?: string[]
        env?: Record<string, string>
        labels?: Record<string, string>
        network?: string
        detach?: boolean
        start?: boolean
        rm?: boolean
        command?: string[]
      }
    ) => {
      try {
        assertTrustedIpcSender(event, 'container:run')
        validateImageRef(options.image)
        if (options.name) validateName(options.name, 'container')
        return await containerService.runContainer(options)
      } catch (error) {
        log.error('container:run failed', error)
        if (error instanceof ValidationError) {
          throw new Error(`Validation error: ${error.message}`)
        }
        throw error
      }
    }
  )

  // 컨테이너 중지
  ipcMain.handle('container:stop', async (event, { id, timeout }: { id: string; timeout?: number }) => {
    try {
      assertTrustedIpcSender(event, 'container:stop')
      validateContainerId(id)
      return await containerService.stopContainer(id, timeout)
    } catch (error) {
      log.error('container:stop failed', error)
      throw error
    }
  })

  // 컨테이너 시작
  ipcMain.handle('container:start', async (event, { id }: { id: string }) => {
    try {
      assertTrustedIpcSender(event, 'container:start')
      validateContainerId(id)
      return await containerService.startContainer(id)
    } catch (error) {
      log.error('container:start failed', error)
      throw error
    }
  })

  // 컨테이너 재시작
  ipcMain.handle(
    'container:restart',
    async (event, { id, timeout }: { id: string; timeout?: number }) => {
      try {
        assertTrustedIpcSender(event, 'container:restart')
        validateContainerId(id)
        return await containerService.restartContainer(id, timeout)
      } catch (error) {
        log.error('container:restart failed', error)
        throw error
      }
    }
  )

  // 컨테이너 삭제
  ipcMain.handle(
    'container:remove',
    async (event, { id, force }: { id: string; force?: boolean }) => {
      try {
        assertTrustedIpcSender(event, 'container:remove')
        validateContainerId(id)
        return await containerService.deleteContainer(id, force)
      } catch (error) {
        log.error('container:remove failed', error)
        throw error
      }
    }
  )

  // 컨테이너 상세 조회
  ipcMain.handle('container:inspect', async (event, { id }: { id: string }) => {
    try {
      assertTrustedIpcSender(event, 'container:inspect')
      validateContainerId(id)
      return await containerService.inspectContainer(id)
    } catch (error) {
      log.error('container:inspect failed', error)
      throw error
    }
  })

  // 컨테이너 로그 조회
  ipcMain.handle(
    'container:logs',
    async (event, { id, tail, timestamps }: { id: string; tail?: number; timestamps?: boolean }) => {
      try {
        assertTrustedIpcSender(event, 'container:logs')
        validateContainerId(id)
        return await containerService.getContainerLogs(id, { tail, timestamps })
      } catch (error) {
        log.error('container:logs failed', error)
        throw error
      }
    }
  )

  // 컨테이너 exec
  ipcMain.handle(
    'container:exec',
    async (event, { id, command }: { id: string; command: string[] }) => {
      try {
        assertTrustedIpcSender(event, 'container:exec')
        validateContainerId(id)
        return await containerService.execInContainer(id, command)
      } catch (error) {
        log.error('container:exec failed', error)
        throw error
      }
    }
  )

  log.info('Container handlers registered')
}
