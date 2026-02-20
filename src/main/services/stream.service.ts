/**
 * 스트리밍 서비스
 * 로그 스트리밍 + exec 세션 관리
 */

import type { ChildProcess } from 'child_process'
import type { WebContents } from 'electron'
import * as pty from 'node-pty'
import { createCLIAdapter, isMockMode, type ContainerCLIAdapter } from '../cli'
import { LOG_BUFFER_MAX_LINES } from '../utils/constants'
import { logger } from '../utils/logger'

const log = logger.scope('StreamService')

/** 버퍼 플러시 간격 (ms) */
const BUFFER_FLUSH_INTERVAL = 100

interface StreamSession {
  process: ChildProcess
  webContents: WebContents
  buffer: string[]
  droppedChunks: number
  flushTimer: NodeJS.Timeout | null
}

interface ExecSession {
  pty: pty.IPty
  webContents: WebContents
  ownerWebContentsId: number
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
    let proc: ChildProcess
    try {
      const adapter = await this.getAdapter()
      proc = adapter.spawnContainerLogs(containerId, {
        tail: options?.tail || 100,
        follow: true
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start log stream'
      log.error('Failed to start log stream', { containerId, error })
      if (!webContents.isDestroyed()) {
        webContents.send(`container:logs:stream:${containerId}:error`, { message })
      }
      throw new Error(message)
    }

    const session: StreamSession = {
      process: proc,
      webContents,
      buffer: [],
      droppedChunks: 0,
      flushTimer: null
    }

    // stdout/stderr 공통 핸들러
    const handleOutput = (data: Buffer) => {
      session.buffer.push(data.toString())
      if (session.buffer.length > LOG_BUFFER_MAX_LINES) {
        const dropped = session.buffer.length - LOG_BUFFER_MAX_LINES
        session.buffer.splice(0, dropped)
        session.droppedChunks += dropped
      }
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
      if (session.droppedChunks > 0) {
        log.warn('Log stream buffer was truncated', {
          containerId,
          droppedChunks: session.droppedChunks
        })
        session.droppedChunks = 0
      }
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
   * Exec 세션 시작 (PTY 기반)
   */
  async startExecSession(
    sessionId: string,
    containerId: string,
    webContents: WebContents,
    command: string[] = ['/bin/sh'],
    options?: { cols?: number; rows?: number }
  ): Promise<void> {
    // 기존 세션이 있으면 중지
    if (this.execSessions.has(sessionId)) {
      this.stopExecSession(sessionId)
    }

    log.info('Starting exec session', { sessionId, containerId, command })

    try {
      const adapter = await this.getAdapter()

      // Mock 모드: 기존 pipe 기반 fallback
      if (isMockMode()) {
        return this.startMockExecSession(sessionId, containerId, webContents, command, adapter)
      }

      const cliPath = await adapter.getCLIPath()
      if (!cliPath) {
        throw new Error('CLI path not available')
      }

      // PTY 환경 변수: undefined 값 제거 (node-pty 네이티브 코드가 null env 처리 불가)
      const safeEnv = Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
      )

      // Apple Container 런타임은 컨테이너 내 TTY 할당(-t)을 미지원(EOPNOTSUPP).
      // node-pty가 호스트 PTY를 제공하므로 -i만으로도 echo/line editing 동작.
      const ptyProcess = pty.spawn(cliPath, ['exec', '-i', containerId, ...command], {
        name: 'xterm-256color',
        cols: options?.cols || 80,
        rows: options?.rows || 24,
        cwd: process.env.HOME || '/',
        env: safeEnv
      })

      const session: ExecSession = {
        pty: ptyProcess,
        webContents,
        ownerWebContentsId: webContents.id,
        containerId
      }

      ptyProcess.onData((data: string) => {
        if (!webContents.isDestroyed()) {
          webContents.send(`exec:output:${sessionId}`, { output: data })
        }
      })

      ptyProcess.onExit(({ exitCode }) => {
        log.debug('Exec session closed', { sessionId, exitCode })
        if (!webContents.isDestroyed()) {
          webContents.send(`exec:close:${sessionId}`, { code: exitCode })
        }
        this.execSessions.delete(sessionId)
      })

      this.execSessions.set(sessionId, session)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start exec session'
      log.error('Failed to start exec session', { sessionId, containerId, error })
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:error:${sessionId}`, { message })
      }
      throw new Error(message)
    }
  }

  /**
   * Mock 모드 exec 세션 (pipe 기반)
   */
  private async startMockExecSession(
    sessionId: string,
    containerId: string,
    webContents: WebContents,
    command: string[],
    adapter: ContainerCLIAdapter
  ): Promise<void> {
    const proc = adapter.spawnContainerExec(containerId, command)

    const mockPty = this.wrapChildProcessAsPty(proc)
    const session: ExecSession = {
      pty: mockPty,
      webContents,
      ownerWebContentsId: webContents.id,
      containerId
    }

    proc.stdout?.on('data', (data: Buffer) => {
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:output:${sessionId}`, { output: data.toString() })
      }
    })
    proc.stderr?.on('data', (data: Buffer) => {
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:output:${sessionId}`, { output: data.toString() })
      }
    })
    proc.on('close', (code: number | null) => {
      log.debug('Mock exec session closed', { sessionId, code })
      if (!webContents.isDestroyed()) {
        webContents.send(`exec:close:${sessionId}`, { code })
      }
      this.execSessions.delete(sessionId)
    })

    this.execSessions.set(sessionId, session)
  }

  /**
   * ChildProcess → IPty 최소 호환 래퍼 (mock 전용)
   */
  private wrapChildProcessAsPty(proc: ChildProcess): pty.IPty {
    return {
      pid: proc.pid ?? 0,
      cols: 80,
      rows: 24,
      process: '',
      handleFlowControl: false,
      onData: (cb: (data: string) => void) => {
        proc.stdout?.on('data', (d: Buffer) => cb(d.toString()))
        return { dispose: () => proc.stdout?.removeAllListeners('data') }
      },
      onExit: (cb: (e: { exitCode: number; signal?: number }) => void) => {
        proc.on('close', (code) => cb({ exitCode: code ?? 0, signal: 0 }))
        return { dispose: () => proc.removeAllListeners('close') }
      },
      write: (data: string) => {
        proc.stdin?.write(data)
      },
      resize: () => {},
      kill: () => {
        proc.kill()
      },
      pause: () => {},
      resume: () => {},
      clear: () => {}
    } as unknown as pty.IPty
  }

  /**
   * Exec 세션에 입력 전송
   */
  sendExecInput(sessionId: string, data: string, senderWebContentsId: number): void {
    const session = this.execSessions.get(sessionId)
    if (session && session.ownerWebContentsId !== senderWebContentsId) {
      log.warn('Rejected exec input from non-owner renderer', { sessionId, senderWebContentsId })
      return
    }
    if (session) {
      session.pty.write(data)
    }
  }

  /**
   * Exec 세션 리사이즈
   */
  resizeExecSession(sessionId: string, cols: number, rows: number, senderWebContentsId: number): void {
    const session = this.execSessions.get(sessionId)
    if (session && session.ownerWebContentsId !== senderWebContentsId) {
      log.warn('Rejected exec resize from non-owner renderer', { sessionId, senderWebContentsId })
      return
    }
    if (session) {
      session.pty.resize(cols, rows)
    }
  }

  /**
   * Exec 세션 중지
   */
  stopExecSession(sessionId: string, senderWebContentsId?: number): void {
    const session = this.execSessions.get(sessionId)
    if (
      session &&
      senderWebContentsId !== undefined &&
      session.ownerWebContentsId !== senderWebContentsId
    ) {
      log.warn('Rejected exec close from non-owner renderer', { sessionId, senderWebContentsId })
      return
    }
    if (session) {
      log.info('Stopping exec session', { sessionId })
      session.pty.kill()
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
