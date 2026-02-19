import type { ContainerRunOptions } from '@/types'

export interface PortMappingInput {
  hostPort: string
  containerPort: string
}

export interface EnvVarInput {
  key: string
  value: string
}

export interface VolumeMountInput {
  hostPath: string
  containerPath: string
}

export interface ContainerCreateFormInput {
  image: string
  name: string
  ports: PortMappingInput[]
  envVars: EnvVarInput[]
  volumes: VolumeMountInput[]
  autoStart: boolean
}

export interface ValidationError {
  title: string
  description: string
}

export type BuildRunOptionsResult =
  | { ok: true; options: ContainerRunOptions }
  | { ok: false; error: ValidationError }

const MIN_PORT = 1
const MAX_PORT = 65535

function parsePort(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return null

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isInteger(parsed)) return null
  if (parsed < MIN_PORT || parsed > MAX_PORT) return null
  return parsed
}

export function buildContainerRunOptions(input: ContainerCreateFormInput): BuildRunOptionsResult {
  const image = input.image.trim()
  if (!image) {
    return {
      ok: false,
      error: {
        title: 'Invalid image',
        description: 'Image is required'
      }
    }
  }

  const portMappings: string[] = []
  const usedHostPorts = new Set<number>()
  for (const [index, port] of input.ports.entries()) {
    const hostRaw = port.hostPort.trim()
    const containerRaw = port.containerPort.trim()
    if (!hostRaw && !containerRaw) continue

    if (!containerRaw) {
      return {
        ok: false,
        error: {
          title: 'Invalid port mapping',
          description: `Row ${index + 1}: Container port is required`
        }
      }
    }

    const containerPort = parsePort(containerRaw)
    if (!containerPort) {
      return {
        ok: false,
        error: {
          title: 'Invalid port mapping',
          description: `Row ${index + 1}: Container port must be 1-65535`
        }
      }
    }

    const hostPort = hostRaw ? parsePort(hostRaw) : containerPort
    if (!hostPort) {
      return {
        ok: false,
        error: {
          title: 'Invalid port mapping',
          description: `Row ${index + 1}: Host port must be 1-65535`
        }
      }
    }

    if (usedHostPorts.has(hostPort)) {
      return {
        ok: false,
        error: {
          title: 'Invalid port mapping',
          description: `Row ${index + 1}: Duplicate host port ${hostPort}`
        }
      }
    }

    usedHostPorts.add(hostPort)
    portMappings.push(`${hostPort}:${containerPort}`)
  }

  const volumeMappings: string[] = []
  for (const [index, volume] of input.volumes.entries()) {
    const hostPath = volume.hostPath.trim()
    const containerPath = volume.containerPath.trim()
    if (!hostPath && !containerPath) continue

    if (!hostPath || !containerPath) {
      return {
        ok: false,
        error: {
          title: 'Invalid volume mapping',
          description: `Row ${index + 1}: Host path and container path are both required`
        }
      }
    }

    if (!containerPath.startsWith('/')) {
      return {
        ok: false,
        error: {
          title: 'Invalid volume mapping',
          description: `Row ${index + 1}: Container path must start with "/"`
        }
      }
    }

    volumeMappings.push(`${hostPath}:${containerPath}`)
  }

  return {
    ok: true,
    options: {
      image,
      name: input.name.trim() || undefined,
      ports: portMappings,
      env: input.envVars.filter((e) => e.key.trim()).reduce(
        (acc, e) => {
          acc[e.key.trim()] = e.value
          return acc
        },
        {} as Record<string, string>
      ),
      volumes: volumeMappings,
      detach: true,
      start: input.autoStart
    }
  }
}
