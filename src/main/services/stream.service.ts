/**
 * 스트리밍 서비스
 * 로그 스트리밍 + exec 세션 관리
 */

import type { ChildProcess } from 'child_process'
import type { WebContents } from 'electron'
import { createCLIAdapter, type ContainerCLIAdapter } from '../cli'
import { logger } from '../utils/logger'

const log = logger.scope('StreamService')

/** 버퍼 플러시 간격 (ms) */
const BUFFER_FLUSH_INTERVAL = 100

interface StreamSession {
  process: ChildProcess
  webContents: WebContents
  buffer: string[]
  flushTimer: NodeJS.Timeout | null
}

interface ExecSession {
  process: ChildProcess
  webContents: WebContents
  containerId: string
}

class StreamService {
  private adapter: ContainerCLIAdapter | null = null
  private logStreams = new Map<string, StreamSession>()
  private execSessions = new Map<string, ExecSession>()

  resetAdapter(): void {
    this.adapter = null
  }

  private async getAdapter(): Promise<ContainerCLIAdapter> {
    if (!this.adapter) {
      this.adapter = await createCLIAdapter()
    }
    return this.adapter
  }

  /**
   * 로그 스트리밍 시작
   */
  async startLogStream(
    containerId: string,
    webContents: WebContents,
    options?: { tail?: number }
  ): Promise<void> {
    // 기존 스트림이 있으면 중지
    if (this.logStreams.has(containerId)) {
      this.stopLogStream(containerId)
    }

    log.info('Starting log stream', { containerId })
    const adapter = await this.getAdapter()
    const proc = adapter.spawnContainerLogs(containerId, {
      tail: options?.tail || 100,
      follow: true
    })

    const session: StreamSession = {
      process: proc,
      webContents,
      buffer: [],
      flushTimer: null
    }

    // stdout/stderr 공통 핸들러
    const handleOutput = (data: Buffer) => {
      session.buffer.push(data.toString())
      if (!session.flushTimer) {
        session.flushTimer = setTimeout(() => {
          this.flushBuffer(containerId, session)
        }, BUFFER_FLUSH_INTERVAL)
      }
    }

    proc.stdout?.on('data', handleOutput)
    proc.stderr?.on('data', handleOutput)

    // 프로세스 종료 처리
    proc.on('close', (code) => {
      log.debug('Log stream closed', { containerId, code })
      this.flushBuffer(containerId, session) // 남은 버퍼 플러시
      if (!webContents.isDestroyed()) {
        webContents.send(`container:logs:stream:${containerId}:close`, { code })
      }
      this.logStreams.delete(containerId)
    })

    proc.on('error', (error) => {
      log.error('Log stream error', { containerId, error })
      if (!webContents.isDestroyed()) {
        webContents.send(`container:logs:stream:${containerId}:error`, {
          message: error.message
        })
      }
      this.logStreams.delete(containerId)
    })

    this.logStreams.set(containerId, session)
  }

  /**
   * 버퍼 플러시
   */
  private flushBuffer(containerId: string, session: StreamSession): void {
    if (session.flushTimer) {
      clearTimeout(session.flushTimer)
      session.flushTimer = null
    }

    if (session.buffer.length > 0 && !session.webContents.isDestroyed()) {
      session.webContents.send(`container:logs:stream:${containerId}`, {
        line: session.buffer.join('')
      })
      session.buffer = []
    }
  }

  /**
   * 로그 스트리밍 중지
   */
  stopLogStream(containerId: string): void {
    const session = this.logStreams.get(containerId)
    if (session) {
      log.info('Stopping log stream', { containerId })
      if (session.flushTimer) {
        clearTimeout(session.flushTimer)
      }
      session.process.kill()
      this.logStreams.delete(containerId)
    }
  }

  /**
   * Exec 세션 시작
   */
  async startExecSession(
    sessionId: string,
    containerId: string,
    webContents: WebContents,
    command: string[] = ['/bin/sh']
  ): Promise<void> {
    // 기존 세션이 있으면 중지
    if (this.execSessions.has(sessionId)) {
      this.stopExecSession(sessionId)
    }

    log.info('Starting exec session', { sessionId, containerId, command })
    const adapter = await this.getAdapter()
    const proc = adapter.spawnContainerExec(containerId, command)

    const session: ExecSession = {
      process: proc,
      webContents,
      containerId
    }

    // stdout/stderr 공통 핸들러
    const handleExecOutput = (data: Buffer) => {
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:output:${sessionId}`, { output: data.toString() })
      }
    }

    proc.stdout?.on('data', handleExecOutput)
    proc.stderr?.on('data', handleExecOutput)

    // 프로세스 종료 처리
    proc.on('close', (code) => {
      log.debug('Exec session closed', { sessionId, code })
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:close:${sessionId}`, { code })
      }
      this.execSessions.delete(sessionId)
    })

    proc.on('error', (error) => {
      log.error('Exec session error', { sessionId, error })
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:error:${sessionId}`, {
          message: error.message
        })
      }
      this.execSessions.delete(sessionId)
    })

    this.execSessions.set(sessionId, session)
  }

  /**
   * Exec 세션에 입력 전송
   */
  sendExecInput(sessionId: string, data: string): void {
    const session = this.execSessions.get(sessionId)
    if (session && session.process.stdin) {
      session.process.stdin.write(data)
    }
  }

  /**
   * Exec 세션 중지
   */
  stopExecSession(sessionId: string): void {
    const session = this.execSessions.get(sessionId)
    if (session) {
      log.info('Stopping exec session', { sessionId })
      session.process.kill()
      this.execSessions.delete(sessionId)
    }
  }

  /**
   * 활성 로그 스트림 ID 목록
   */
  getActiveLogStreams(): string[] {
    return Array.from(this.logStreams.keys())
  }

  /**
   * 활성 exec 세션 ID 목록
   */
  getActiveExecSessions(): string[] {
    return Array.from(this.execSessions.keys())
  }

  /**
   * 모든 스트림/세션 정리
   * Note: Array.from()을 사용하여 iteration 중 Map 수정 시 안전하게 처리
   */
  cleanup(): void {
    log.info('Cleaning up all streams and sessions')
    for (const containerId of Array.from(this.logStreams.keys())) {
      this.stopLogStream(containerId)
    }
    for (const sessionId of Array.from(this.execSessions.keys())) {
      this.stopExecSession(sessionId)
    }
  }
}

export const streamService = new StreamService()
