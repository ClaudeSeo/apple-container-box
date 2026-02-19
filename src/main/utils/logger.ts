/**
 * electron-log 기반 로거
 * Main Process와 Renderer에서 일관된 로깅 제공
 */

import log from 'electron-log'
import { app } from 'electron'
import { APP_NAME } from './constants'

/** 로그 레벨 타입 */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'

/** 로거 초기화 */
export function initLogger(): void {
  // 로그 파일 위치 설정
  log.transports.file.resolvePathFn = () => {
    const userDataPath = app.getPath('userData')
    return `${userDataPath}/logs/${APP_NAME}.log`
  }

  // 파일 로그 설정
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  // 콘솔 로그 설정 (개발 환경)
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  log.transports.console.format = '{h}:{i}:{s} [{level}] {text}'

  // 에러 핸들링
  log.catchErrors({
    showDialog: false,
    onError: (error) => {
      logger.error('Uncaught exception:', error)
    }
  })

  logger.info(`Logger initialized (env: ${process.env.NODE_ENV})`)
}

/** 로거 인스턴스 */
export const logger = {
  error: (message: string, ...args: unknown[]) => log.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => log.warn(message, ...args),
  info: (message: string, ...args: unknown[]) => log.info(message, ...args),
  verbose: (message: string, ...args: unknown[]) => log.verbose(message, ...args),
  debug: (message: string, ...args: unknown[]) => log.debug(message, ...args),
  silly: (message: string, ...args: unknown[]) => log.silly(message, ...args),

  /** 스코프 로거 생성 (ex: logger.scope('CLI')) */
  scope: (name: string) => ({
    error: (message: string, ...args: unknown[]) => log.error(`[${name}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => log.warn(`[${name}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => log.info(`[${name}] ${message}`, ...args),
    verbose: (message: string, ...args: unknown[]) => log.verbose(`[${name}] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => log.debug(`[${name}] ${message}`, ...args),
    silly: (message: string, ...args: unknown[]) => log.silly(`[${name}] ${message}`, ...args)
  })
}

export default logger
