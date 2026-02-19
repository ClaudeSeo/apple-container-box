/**
 * Mock CLI 어댑터
 * 개발/테스트용 가짜 데이터 제공
 */

import type { ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
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


/** Mock 컨테이너 데이터 */
const MOCK_CONTAINERS: CLIContainer[] = [
  {
    id: 'a1b2c3d4e5f6',
    name: 'web-server',
    image: 'nginx:latest',
    status: 'running',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    ports: [{ hostPort: 8080, containerPort: 80, protocol: 'tcp' }],
    mounts: [{ type: 'bind', source: '/var/www', target: '/usr/share/nginx/html', readonly: true }],
    env: { NGINX_HOST: 'localhost' },
    labels: { 'com.example.app': 'web' },
    command: 'nginx -g daemon off;',
    network: 'bridge'
  },
  {
    id: 'b2c3d4e5f6g7',
    name: 'database',
    image: 'postgres:16',
    status: 'running',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    ports: [{ hostPort: 5432, containerPort: 5432, protocol: 'tcp' }],
    mounts: [{ type: 'volume', source: 'pgdata', target: '/var/lib/postgresql/data', readonly: false }],
    env: { POSTGRES_DB: 'app', POSTGRES_USER: 'admin' },
    labels: { 'com.example.app': 'db' },
    command: 'postgres',
    network: 'backend'
  },
  {
    id: 'c3d4e5f6g7h8',
    name: 'cache',
    image: 'redis:7-alpine',
    status: 'running',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    ports: [{ hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
    mounts: [],
    env: {},
    labels: { 'com.example.app': 'cache' },
    command: 'redis-server',
    network: 'backend'
  },
  {
    id: 'd4e5f6g7h8i9',
    name: 'api-server',
    image: 'node:20-alpine',
    status: 'error',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    ports: [{ hostPort: 3000, containerPort: 3000, protocol: 'tcp' }],
    mounts: [{ type: 'bind', source: '/app', target: '/app', readonly: false }],
    env: { NODE_ENV: 'development' },
    labels: { 'com.example.app': 'api' },
    command: 'npm start',
    network: 'backend'
  },
  {
    id: 'e5f6g7h8i9j0',
    name: 'mongodb',
    image: 'mongo:7',
    status: 'stopped',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    ports: [{ hostPort: 27017, containerPort: 27017, protocol: 'tcp' }],
    mounts: [{ type: 'volume', source: 'mongodata', target: '/data/db', readonly: false }],
    env: {},
    labels: {},
    command: 'mongod',
    network: 'bridge'
  },
  {
    id: 'f6g7h8i9j0k1',
    name: 'queue',
    image: 'rabbitmq:3-management',
    status: 'running',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    ports: [
      { hostPort: 5672, containerPort: 5672, protocol: 'tcp' },
      { hostPort: 15672, containerPort: 15672, protocol: 'tcp' }
    ],
    mounts: [],
    env: {},
    labels: { 'com.example.app': 'mq' },
    command: 'rabbitmq-server',
    network: 'backend'
  }
]

/** Mock 이미지 데이터 */
const MOCK_IMAGES: CLIImage[] = [
  { id: 'sha256:abc123', repository: 'nginx', tag: 'latest', createdAt: '2024-01-15T10:00:00Z', size: 187000000, labels: {} },
  { id: 'sha256:def456', repository: 'postgres', tag: '16', createdAt: '2024-01-10T08:00:00Z', size: 432000000, labels: {} },
  { id: 'sha256:ghi789', repository: 'redis', tag: '7-alpine', createdAt: '2024-01-12T14:00:00Z', size: 41000000, labels: {} },
  { id: 'sha256:jkl012', repository: 'node', tag: '20-alpine', createdAt: '2024-01-08T12:00:00Z', size: 178000000, labels: {} },
  { id: 'sha256:mno345', repository: 'mongo', tag: '7', createdAt: '2024-01-05T16:00:00Z', size: 758000000, labels: {} },
  { id: 'sha256:pqr678', repository: 'rabbitmq', tag: '3-management', createdAt: '2024-01-14T11:00:00Z', size: 252000000, labels: {} },
  { id: 'sha256:stu901', repository: 'alpine', tag: 'latest', createdAt: '2024-01-01T00:00:00Z', size: 7800000, labels: {} }
]

/** Mock 볼륨 데이터 */
const MOCK_VOLUMES: CLIVolume[] = [
  { name: 'pgdata', driver: 'local', mountpoint: '/var/lib/containers/storage/volumes/pgdata/_data', createdAt: '2024-01-10T08:00:00Z', labels: {} },
  { name: 'mongodata', driver: 'local', mountpoint: '/var/lib/containers/storage/volumes/mongodata/_data', createdAt: '2024-01-05T16:00:00Z', labels: {} },
  { name: 'redis-data', driver: 'local', mountpoint: '/var/lib/containers/storage/volumes/redis-data/_data', createdAt: '2024-01-12T14:00:00Z', labels: {} }
]

/** Mock 네트워크 데이터 */
const MOCK_NETWORKS: CLINetwork[] = [
  { id: 'default', name: 'default', driver: 'nat', createdAt: '2024-01-01T00:00:00Z', subnet: '192.168.65.0/24', gateway: '192.168.65.1', labels: { 'com.apple.container.resource.role': 'builtin' }, internal: false, state: 'running', ipv6Subnet: 'fd23:6a89:551a:a8d6::/64' },
  { id: 'backend', name: 'backend', driver: 'nat', createdAt: '2024-01-05T10:00:00Z', subnet: '192.168.66.0/24', gateway: '192.168.66.1', labels: { env: 'dev' }, internal: false, state: 'running' },
  { id: 'frontend', name: 'frontend', driver: 'nat', createdAt: '2024-01-05T10:00:00Z', subnet: '192.168.67.0/24', gateway: '192.168.67.1', labels: {}, internal: false, state: 'running' }
]

/** 가짜 ChildProcess 생성 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFakeChildProcess(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.stdin = {
    write: (_data: string) => {
      /* noop for mock */
    }
  }
  proc.pid = Math.floor(Math.random() * 10000)
  proc.killed = false
  proc.kill = () => {
    proc.killed = true
    proc.emit('close', 0)
    return true
  }
  return proc
}

/**
 * Mock CLI 어댑터 구현
 */
export class MockContainerCLI implements ContainerCLIAdapter {
  private containers = [...MOCK_CONTAINERS]
  private images = [...MOCK_IMAGES]
  private volumes = [...MOCK_VOLUMES]
  private networks = [...MOCK_NETWORKS]

  async listContainers(options?: { all?: boolean }): Promise<CLIContainer[]> {
    await this.delay(100)
    if (options?.all) return this.containers
    return this.containers.filter((c) => c.status === 'running')
  }

  async runContainer(options: ContainerRunOptions): Promise<{ id: string }> {
    await this.delay(500)
    const id = this.generateId()
    const status = options.start === false ? 'stopped' : 'running'
    const container: CLIContainer = {
      id,
      name: options.name || `container-${id.slice(0, 8)}`,
      image: options.image,
      status,
      createdAt: new Date().toISOString(),
      ports: (options.ports || []).map((p) => {
        const [host, container] = p.split(':')
        return { hostPort: parseInt(host), containerPort: parseInt(container), protocol: 'tcp' as const }
      }),
      mounts: [],
      env: options.env || {},
      labels: options.labels || {},
      network: options.network
    }
    this.containers.unshift(container)
    return { id }
  }

  async stopContainer(id: string): Promise<void> {
    await this.delay(300)
    const container = this.containers.find((c) => c.id.startsWith(id))
    if (container) container.status = 'stopped'
  }

  async startContainer(id: string): Promise<void> {
    await this.delay(300)
    const container = this.containers.find((c) => c.id.startsWith(id))
    if (container) container.status = 'running'
  }

  async restartContainer(id: string): Promise<void> {
    await this.delay(500)
    const container = this.containers.find((c) => c.id.startsWith(id))
    if (container) {
      container.status = 'restarting'
      setTimeout(() => {
        container.status = 'running'
      }, 1000)
    }
  }

  async deleteContainer(id: string): Promise<void> {
    await this.delay(200)
    this.containers = this.containers.filter((c) => !c.id.startsWith(id))
  }

  async inspectContainer(id: string): Promise<CLIContainer> {
    await this.delay(50)
    const container = this.containers.find((c) => c.id.startsWith(id))
    if (!container) throw new Error(`Container not found: ${id}`)
    return container
  }

  async getContainerStats(id: string): Promise<CLIContainerStats> {
    await this.delay(50)
    return {
      containerId: id,
      cpuPercent: Math.random() * 30,
      memoryUsage: Math.floor(Math.random() * 500000000),
      memoryLimit: 1000000000,
      networkRx: Math.floor(Math.random() * 10000000),
      networkTx: Math.floor(Math.random() * 5000000),
      blockRead: Math.floor(Math.random() * 1000000),
      blockWrite: Math.floor(Math.random() * 500000),
      timestamp: Date.now()
    }
  }

  spawnContainerLogs(id: string, options?: { tail?: number; follow?: boolean }): ChildProcess {
    const proc = createFakeChildProcess()
    const logs = [
      `[${new Date().toISOString()}] Container ${id} started`,
      `[${new Date().toISOString()}] Listening on port 80`,
      `[${new Date().toISOString()}] Ready to accept connections`
    ]

    setTimeout(() => {
      logs.forEach((line, i) => {
        setTimeout(() => {
          proc.stdout?.emit('data', Buffer.from(line + '\n'))
        }, i * 100)
      })

      if (options?.follow) {
        const interval = setInterval(() => {
          const line = `[${new Date().toISOString()}] Request processed\n`
          proc.stdout?.emit('data', Buffer.from(line))
        }, 2000)
        proc.on('close', () => clearInterval(interval))
      } else {
        setTimeout(() => proc.emit('close', 0), logs.length * 100 + 100)
      }
    }, 50)

    return proc as unknown as ChildProcess
  }

  spawnContainerExec(_id: string, command: string[]): ChildProcess {
    const proc = createFakeChildProcess()
    setTimeout(() => {
      proc.stdout?.emit('data', Buffer.from(`$ ${command.join(' ')}\n`))
      proc.stdout?.emit('data', Buffer.from('Mock shell ready\n'))
    }, 100)
    return proc as unknown as ChildProcess
  }

  async listImages(): Promise<CLIImage[]> {
    await this.delay(100)
    return this.images
  }

  async pullImage(ref: string, onProgress?: (data: string) => void): Promise<void> {
    const steps = ['Pulling from library/' + ref, 'Downloading', 'Extracting', 'Pull complete']
    for (const step of steps) {
      await this.delay(500)
      onProgress?.(step)
    }
  }

  async deleteImage(id: string): Promise<void> {
    await this.delay(200)
    this.images = this.images.filter((i) => !i.id.includes(id))
  }

  async buildImage(_options: ImageBuildOptions, onProgress?: (data: string) => void): Promise<{ id: string }> {
    const steps = ['Step 1/3: FROM alpine', 'Step 2/3: RUN echo hello', 'Step 3/3: CMD ["sh"]', 'Successfully built']
    for (const step of steps) {
      await this.delay(300)
      onProgress?.(step)
    }
    return { id: this.generateId() }
  }

  async inspectImage(id: string): Promise<unknown> {
    await this.delay(50)
    const image = this.images.find((i) => i.id.includes(id) || `${i.repository}:${i.tag}` === id)
    if (!image) throw new Error(`Image not found: ${id}`)
    return image
  }

  async listVolumes(): Promise<CLIVolume[]> {
    await this.delay(50)
    return this.volumes
  }

  async createVolume(name: string): Promise<CLIVolume> {
    await this.delay(100)
    const volume: CLIVolume = {
      name,
      driver: 'local',
      mountpoint: `/var/lib/containers/storage/volumes/${name}/_data`,
      createdAt: new Date().toISOString(),
      labels: {}
    }
    this.volumes.push(volume)
    return volume
  }

  async deleteVolume(name: string): Promise<void> {
    await this.delay(100)
    this.volumes = this.volumes.filter((v) => v.name !== name)
  }

  async inspectVolume(name: string): Promise<CLIVolume> {
    await this.delay(50)
    const volume = this.volumes.find((v) => v.name === name)
    if (!volume) throw new Error(`Volume not found: ${name}`)
    return volume
  }

  async inspectVolumeRaw(name: string): Promise<unknown> {
    await this.delay(50)
    const volume = this.volumes.find((v) => v.name === name)
    if (!volume) throw new Error(`Volume not found: ${name}`)
    return volume
  }

  async listNetworks(): Promise<CLINetwork[]> {
    await this.delay(50)
    return this.networks
  }

  async createNetwork(name: string, driver?: string, subnet?: string): Promise<CLINetwork> {
    await this.delay(100)
    const network: CLINetwork = {
      id: this.generateId(),
      name,
      driver: driver || 'bridge',
      createdAt: new Date().toISOString(),
      subnet,
      labels: {},
      internal: false
    }
    this.networks.push(network)
    return network
  }

  async deleteNetwork(id: string): Promise<void> {
    await this.delay(100)
    this.networks = this.networks.filter((n) => n.id !== id && n.name !== id)
  }

  async inspectNetwork(id: string): Promise<CLINetwork> {
    await this.delay(50)
    const network = this.networks.find((n) => n.id === id || n.name === id)
    if (!network) throw new Error(`Network not found: ${id}`)
    return network
  }

  async checkCLIAvailable(): Promise<boolean> {
    return true
  }

  async getCLIPath(): Promise<string | undefined> {
    return '/usr/local/bin/container (mock)'
  }

  async getCLIVersion(): Promise<string> {
    return '1.0.0-mock'
  }

  async getSystemInfo() {
    return {
      runningContainers: this.containers.filter((c) => c.status === 'running').length,
      totalContainers: this.containers.length,
      imageCount: this.images.length,
      volumeCount: this.volumes.length
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private generateId(): string {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}
