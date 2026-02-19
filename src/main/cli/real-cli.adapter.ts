/**
 * Real CLI 어댑터
 * Apple Container CLI 바이너리를 실행하여 실제 컨테이너 관리
 */

import { spawn, execFile, type ChildProcess } from 'child_process'
import { promisify } from 'util'
import type {
  ContainerCLIAdapter,
  CLIContainer,
  CLIContainerStats,
  CLIImage,
  CLIVolume,
  CLINetwork,
  ContainerRunOptions,
  ImageBuildOptions
} from './adapter.interface'
import { CLIError, CLIErrorCode } from './types'
import {
  parseContainerList,
  parseImageList,
  parseVolumeList,
  parseNetworkList,
  parseNetworkInspect,
  parseContainerStats,
  parseErrorCode,
  parseJSON
} from './parser'
import {
  validateContainerId,
  validateImageRef,
  validateName,
  validatePortMapping,
  validateVolumeMount,
  validateEnvVars
} from './validator'
import { logger } from '../utils/logger'
import { CLI_BINARY, CLI_DEFAULT_PATHS, CLI_TIMEOUT_DEFAULT, CLI_TIMEOUT_LONG } from '../utils/constants'

const execFileAsync = promisify(execFile)
const log = logger.scope('CLI')

/**
 * Real CLI 어댑터 구현
 */
export class RealContainerCLI implements ContainerCLIAdapter {
  private cliPath: string | null = null

  constructor(cliPath?: string) {
    if (cliPath) this.cliPath = cliPath
  }

  /** CLI 경로 찾기 */
  private async findCLIPath(): Promise<string> {
    if (this.cliPath) return this.cliPath

    // 기본 경로들 확인
    for (const path of CLI_DEFAULT_PATHS) {
      try {
        await execFileAsync(path, ['--version'], { timeout: 5000 })
        this.cliPath = path
        log.info(`CLI found at: ${path}`)
        return path
      } catch {
        continue
      }
    }

    // PATH에서 찾기
    try {
      const { stdout } = await execFileAsync('which', [CLI_BINARY], { timeout: 5000 })
      const path = stdout.trim()
      if (path) {
        this.cliPath = path
        log.info(`CLI found in PATH: ${path}`)
        return path
      }
    } catch {
      // which 명령 실패
    }

    throw new CLIError(CLIErrorCode.CLI_NOT_FOUND, `CLI binary '${CLI_BINARY}' not found`)
  }

  /** CLI 명령 실행 */
  private async exec(args: string[], timeout = CLI_TIMEOUT_DEFAULT): Promise<string> {
    const cliPath = await this.findCLIPath()
    log.debug(`Executing: ${cliPath} ${args.join(' ')}`)

    try {
      const { stdout, stderr } = await execFileAsync(cliPath, args, { timeout })
      if (stderr) log.warn(`CLI stderr: ${stderr}`)
      return stdout
    } catch (error: unknown) {
      const err = error as { code?: string; killed?: boolean; stderr?: string; message?: string }
      if (err.killed || err.code === 'ETIMEDOUT') {
        throw new CLIError(CLIErrorCode.TIMEOUT, `Command timed out: ${args.join(' ')}`)
      }
      const code = parseErrorCode(err.stderr || err.message || '')
      throw new CLIError(code, err.stderr || err.message || 'Unknown error', err.stderr)
    }
  }

  /** 스트리밍 명령 실행 (logs, exec 등) */
  private spawnProcess(args: string[]): ChildProcess {
    // cliPath가 설정되어 있지 않으면 기본 경로 사용
    // Note: spawn 전에 exec/findCLIPath가 먼저 호출되어 cliPath가 설정되어야 함
    if (!this.cliPath) {
      log.warn('cliPath not set, using default path. Call findCLIPath() first for better reliability.')
    }
    const cliPath = this.cliPath || CLI_DEFAULT_PATHS[0]
    if (!cliPath) {
      throw new CLIError(CLIErrorCode.CLI_NOT_FOUND, 'CLI path not available')
    }
    log.debug(`Spawning: ${cliPath} ${args.join(' ')}`)
    return spawn(cliPath, args, { stdio: ['pipe', 'pipe', 'pipe'] })
  }

  // Container 관리
  async listContainers(options?: { all?: boolean }): Promise<CLIContainer[]> {
    const args = ['list', '--format', 'json']
    if (options?.all) args.push('-a')
    const output = await this.exec(args)
    const result = parseContainerList(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.PARSE_ERROR, result.error!.message, result.error!.raw)
    }
    return result.data!
  }

  async runContainer(options: ContainerRunOptions): Promise<{ id: string }> {
    validateImageRef(options.image)
    if (options.name) validateName(options.name, 'container')
    if (options.env) validateEnvVars(options.env)

    const buildArgs = (subcommand: 'run' | 'create'): string[] => {
      const args: string[] = [subcommand]
      if (subcommand === 'run' && options.detach !== false) args.push('-d')
      if (options.rm) args.push('--rm')
      if (options.name) args.push('--name', options.name)
      if (options.network) args.push('--network', options.network)

      for (const port of options.ports || []) {
        validatePortMapping(port)
        args.push('-p', port)
      }

      for (const vol of options.volumes || []) {
        validateVolumeMount(vol)
        args.push('-v', vol)
      }

      for (const [key, value] of Object.entries(options.env || {})) {
        args.push('-e', `${key}=${value}`)
      }

      for (const [key, value] of Object.entries(options.labels || {})) {
        args.push('--label', `${key}=${value}`)
      }

      args.push(options.image)
      if (options.command) {
        args.push(...options.command)
      }

      return args
    }

    if (options.start === false) {
      try {
        const output = await this.exec(buildArgs('create'), CLI_TIMEOUT_LONG)
        return { id: output.trim() }
      } catch (error) {
        log.warn('create command failed, falling back to run + stop', error)
        const output = await this.exec(buildArgs('run'), CLI_TIMEOUT_LONG)
        const id = output.trim()
        await this.stopContainer(id)
        return { id }
      }
    }

    const output = await this.exec(buildArgs('run'), CLI_TIMEOUT_LONG)
    return { id: output.trim() }
  }

  async stopContainer(id: string, timeout?: number): Promise<void> {
    validateContainerId(id)
    const args = ['stop']
    if (timeout) args.push('-t', String(timeout))
    args.push(id)
    await this.exec(args)
  }

  async startContainer(id: string): Promise<void> {
    validateContainerId(id)
    await this.exec(['start', id])
  }

  async restartContainer(id: string, timeout?: number): Promise<void> {
    // Apple CLI에는 restart 명령어가 없으므로 stop + start 순차 실행
    await this.stopContainer(id, timeout)
    await this.startContainer(id)
  }

  async deleteContainer(id: string, force?: boolean): Promise<void> {
    validateContainerId(id)
    const args = ['rm']
    if (force) args.push('-f')
    args.push(id)
    await this.exec(args)
  }

  async inspectContainer(id: string): Promise<CLIContainer> {
    validateContainerId(id)
    const output = await this.exec(['inspect', id])
    const result = parseContainerList(output)
    if (!result.success || !result.data?.[0]) {
      throw new CLIError(CLIErrorCode.NOT_FOUND, `Container not found: ${id}`)
    }
    return result.data[0]
  }

  async getContainerStats(id: string): Promise<CLIContainerStats> {
    validateContainerId(id)
    const output = await this.exec(['stats', '--no-stream', '--format', 'json', id])
    const result = parseContainerStats(output, id)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.PARSE_ERROR, result.error!.message)
    }
    return result.data!
  }

  spawnContainerLogs(id: string, options?: { tail?: number; follow?: boolean }): ChildProcess {
    const args = ['logs', id]
    if (options?.tail) args.push('-n', String(options.tail))
    if (options?.follow) args.push('-f')
    return this.spawnProcess(args)
  }

  spawnContainerExec(id: string, command: string[]): ChildProcess {
    const args = ['exec', '-i', '-t', id, ...command]
    return this.spawnProcess(args)
  }

  // Image 관리
  async listImages(): Promise<CLIImage[]> {
    const output = await this.exec(['image', 'list', '--format', 'json'])
    const result = parseImageList(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.PARSE_ERROR, result.error!.message)
    }
    return result.data!
  }

  async pullImage(ref: string, onProgress?: (data: string) => void): Promise<void> {
    validateImageRef(ref)
    const proc = this.spawnProcess(['image', 'pull', ref])

    return new Promise((resolve, reject) => {
      proc.stdout?.on('data', (data: Buffer) => {
        onProgress?.(data.toString())
      })
      proc.stderr?.on('data', (data: Buffer) => {
        onProgress?.(data.toString())
      })
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new CLIError(CLIErrorCode.UNKNOWN, `Pull failed with code ${code}`))
      })
      proc.on('error', (err) => {
        reject(new CLIError(CLIErrorCode.UNKNOWN, err.message))
      })
    })
  }

  async deleteImage(id: string, force?: boolean): Promise<void> {
    const args = ['image', 'rm']
    if (force) args.push('-f')
    args.push(id)
    await this.exec(args)
  }

  async buildImage(options: ImageBuildOptions, onProgress?: (data: string) => void): Promise<{ id: string }> {
    validateImageRef(options.tag)
    const args = ['build', '-t', options.tag]
    if (options.file) args.push('-f', options.file)
    if (options.noCache) args.push('--no-cache')
    if (options.target) args.push('--target', options.target)
    for (const [key, value] of Object.entries(options.buildArgs || {})) {
      args.push('--build-arg', `${key}=${value}`)
    }
    args.push(options.context)

    const proc = this.spawnProcess(args)

    return new Promise((resolve, reject) => {
      let lastLine = ''
      proc.stdout?.on('data', (data: Buffer) => {
        lastLine = data.toString()
        onProgress?.(lastLine)
      })
      proc.stderr?.on('data', (data: Buffer) => {
        onProgress?.(data.toString())
      })
      proc.on('close', (code) => {
        if (code === 0) {
          // 빌드 성공 시 이미지 ID 추출 시도
          const match = lastLine.match(/sha256:([a-f0-9]+)/)
          resolve({ id: match?.[1] || 'unknown' })
        } else {
          reject(new CLIError(CLIErrorCode.UNKNOWN, `Build failed with code ${code}`))
        }
      })
      proc.on('error', (err) => {
        reject(new CLIError(CLIErrorCode.UNKNOWN, err.message))
      })
    })
  }

  async inspectImage(id: string): Promise<unknown> {
    validateImageRef(id)
    const output = await this.exec(['image', 'inspect', id])
    const result = parseJSON<unknown>(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.NOT_FOUND, `Image not found: ${id}`)
    }
    return result.data
  }

  // Volume 관리
  async listVolumes(): Promise<CLIVolume[]> {
    const output = await this.exec(['volume', 'list', '--format', 'json'])
    const result = parseVolumeList(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.PARSE_ERROR, result.error!.message)
    }
    return result.data!
  }

  async createVolume(name: string, _driver?: string): Promise<CLIVolume> {
    validateName(name, 'volume')
    const args = ['volume', 'create', name]
    await this.exec(args)
    return this.inspectVolume(name)
  }

  async deleteVolume(name: string, _force?: boolean): Promise<void> {
    validateName(name, 'volume')
    await this.exec(['volume', 'rm', name])
  }

  async inspectVolume(name: string): Promise<CLIVolume> {
    validateName(name, 'volume')
    const output = await this.exec(['volume', 'inspect', name])
    const result = parseJSON<CLIVolume[]>(output)
    if (!result.success || !result.data?.[0]) {
      throw new CLIError(CLIErrorCode.NOT_FOUND, `Volume not found: ${name}`)
    }
    return result.data[0]
  }

  async inspectVolumeRaw(name: string): Promise<unknown> {
    validateName(name, 'volume')
    const output = await this.exec(['volume', 'inspect', name])
    const result = parseJSON<unknown>(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.NOT_FOUND, `Volume not found: ${name}`)
    }
    return result.data
  }

  // Network 관리
  async listNetworks(): Promise<CLINetwork[]> {
    const output = await this.exec(['network', 'list', '--format', 'json'])
    const result = parseNetworkList(output)
    if (!result.success) {
      throw new CLIError(CLIErrorCode.PARSE_ERROR, result.error!.message)
    }
    return result.data!
  }

  async createNetwork(name: string, _driver?: string, subnet?: string): Promise<CLINetwork> {
    validateName(name, 'network')
    const args = ['network', 'create']
    if (subnet) args.push('--subnet', subnet)
    args.push(name)
    await this.exec(args)
    return this.inspectNetwork(name)
  }

  async deleteNetwork(id: string, _force?: boolean): Promise<void> {
    await this.exec(['network', 'rm', id])
  }

  async inspectNetwork(id: string): Promise<CLINetwork> {
    const output = await this.exec(['network', 'inspect', id])
    const result = parseNetworkInspect(output)
    if (!result.success || !result.data) {
      throw new CLIError(CLIErrorCode.NOT_FOUND, `Network not found: ${id}`)
    }
    return result.data
  }

  // 시스템
  async checkCLIAvailable(): Promise<boolean> {
    try {
      await this.findCLIPath()
      return true
    } catch {
      return false
    }
  }

  async getCLIPath(): Promise<string | undefined> {
    try {
      return await this.findCLIPath()
    } catch {
      return undefined
    }
  }

  async getCLIVersion(): Promise<string> {
    const output = await this.exec(['--version'])
    return output.trim()
  }

  async getSystemInfo() {
    const [containers, images, volumes] = await Promise.all([
      this.listContainers({ all: true }),
      this.listImages(),
      this.listVolumes()
    ])
    return {
      runningContainers: containers.filter((c) => c.status === 'running').length,
      totalContainers: containers.length,
      imageCount: images.length,
      volumeCount: volumes.length
    }
  }
}
