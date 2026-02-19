/**
 * CLI 어댑터 팩토리
 * 환경에 따라 Real 또는 Mock 어댑터 반환
 */

import type { ContainerCLIAdapter } from './adapter.interface'
import { RealContainerCLI } from './real-cli.adapter'
import { MockContainerCLI } from './mock-cli.adapter'
import { logger } from '../utils/logger'
import { settingsStore } from '../store/settings.store'

const log = logger.scope('CLI-Factory')

/** 싱글턴 어댑터 인스턴스 */
let adapterInstance: ContainerCLIAdapter | null = null

/**
 * CLI 어댑터 생성
 * - CONTAINER_BOX_MOCK=true: 항상 Mock 반환
 * - 그 외: CLI 가용성 확인 후 Real 또는 Mock 반환
 */
export async function createCLIAdapter(): Promise<ContainerCLIAdapter> {
  if (adapterInstance) {
    return adapterInstance
  }

  // 환경 변수로 Mock 모드 강제
  if (process.env.CONTAINER_BOX_MOCK === 'true') {
    log.info('Using MockContainerCLI (CONTAINER_BOX_MOCK=true)')
    adapterInstance = new MockContainerCLI()
    return adapterInstance
  }

  const settings = settingsStore.get()
  const customPath = settings.cli.customPath || undefined

  if (customPath) {
    log.info(`Using custom CLI path preference: ${customPath}`)
  }

  // Real CLI 가용성 확인
  const realCLI = new RealContainerCLI(customPath)
  try {
    const available = await realCLI.checkCLIAvailable()
    if (available) {
      const version = await realCLI.getCLIVersion()
      log.info(`Using RealContainerCLI (version: ${version})`)
      adapterInstance = realCLI
      return adapterInstance
    }
  } catch (error) {
    log.warn('Real CLI not available, falling back to Mock', error)
  }

  // CLI가 없으면 Mock으로 폴백
  log.info('Using MockContainerCLI (CLI not found)')
  adapterInstance = new MockContainerCLI()
  return adapterInstance
}

/**
 * 현재 어댑터 인스턴스 가져오기 (이미 생성된 경우)
 */
export function getCLIAdapter(): ContainerCLIAdapter | null {
  return adapterInstance
}

/**
 * 어댑터 인스턴스 초기화 (테스트용)
 */
export function resetCLIAdapter(): void {
  adapterInstance = null
}

/**
 * Mock 모드 여부 확인
 */
export function isMockMode(): boolean {
  return adapterInstance instanceof MockContainerCLI
}
