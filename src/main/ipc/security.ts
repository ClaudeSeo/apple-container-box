/**
 * IPC 보안 유틸리티
 */

import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { logger } from '../utils/logger'

const log = logger.scope('IPCSecurity')

const DEV_LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const IS_TEST_ENV = process.env.NODE_ENV === 'test' || typeof process.env.VITEST !== 'undefined'

type IPCEvent = Pick<IpcMainEvent, 'sender' | 'senderFrame'> | Pick<IpcMainInvokeEvent, 'sender' | 'senderFrame'>

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl)
  } catch {
    return null
  }
}

function isLocalhostHost(hostname: string): boolean {
  return DEV_LOCALHOST_HOSTS.has(hostname)
}

function resolveTrustedDevServerOrigin(): string | null {
  const rawDevServerUrl = process.env.ELECTRON_RENDERER_URL?.trim()
  if (!rawDevServerUrl) return null
  const parsed = parseUrl(rawDevServerUrl)
  if (!parsed) return null
  if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && isLocalhostHost(parsed.hostname)) {
    return parsed.origin
  }
  return null
}

function resolveSenderUrl(event: IPCEvent): string | null {
  const frameUrl = event.senderFrame?.url?.trim()
  if (frameUrl) {
    return frameUrl
  }

  const sender = event.sender as { getURL?: () => string; isDestroyed?: () => boolean } | undefined
  if (!sender || sender.isDestroyed?.()) {
    return null
  }

  const senderUrl = sender.getURL?.().trim()
  return senderUrl || null
}

function isTrustedSenderUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false

  if (parsed.protocol === 'file:') return true

  const trustedDevOrigin = resolveTrustedDevServerOrigin()
  if (trustedDevOrigin && parsed.origin === trustedDevOrigin) return true

  return false
}

/**
 * IPC sender 신뢰 검증
 */
export function assertTrustedIpcSender(event: IPCEvent, channel: string): void {
  const senderUrl = resolveSenderUrl(event)

  if (!senderUrl) {
    if (IS_TEST_ENV) return
    log.warn('IPC blocked: sender URL missing', { channel })
    throw new Error('Unauthorized IPC sender')
  }

  if (!isTrustedSenderUrl(senderUrl)) {
    log.warn('IPC blocked: untrusted sender', { channel, senderUrl })
    throw new Error('Unauthorized IPC sender')
  }
}

/**
 * 외부 URL allowlist 검증
 * - 기본: https만 허용
 * - 개발 모드: localhost 계열에 한해 http 허용
 */
export function isAllowedExternalUrl(rawUrl: string): boolean {
  const parsed = parseUrl(rawUrl)
  if (!parsed) return false

  if (parsed.protocol === 'https:') return true

  const trustedDevOrigin = resolveTrustedDevServerOrigin()
  if (
    trustedDevOrigin &&
    (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
    parsed.origin === trustedDevOrigin
  ) {
    return true
  }

  return false
}
