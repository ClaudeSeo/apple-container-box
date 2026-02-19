import { describe, expect, it } from 'vitest'
import { buildContainerRunOptions } from './container-create.validation'

describe('buildContainerRunOptions', () => {
  it('builds options and preserves start=false for non-auto-start create', () => {
    const result = buildContainerRunOptions({
      image: 'nginx:latest',
      name: 'web',
      ports: [{ hostPort: '', containerPort: '8080' }],
      envVars: [{ key: ' NODE_ENV ', value: 'production' }],
      volumes: [{ hostPath: '/tmp/data', containerPath: '/data' }],
      autoStart: false
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.options).toMatchObject({
      image: 'nginx:latest',
      name: 'web',
      ports: ['8080:8080'],
      env: { NODE_ENV: 'production' },
      volumes: ['/tmp/data:/data'],
      start: false
    })
  })

  it('rejects invalid port mappings', () => {
    const result = buildContainerRunOptions({
      image: 'nginx:latest',
      name: '',
      ports: [{ hostPort: '70000', containerPort: '80' }],
      envVars: [],
      volumes: [],
      autoStart: true
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.title).toBe('Invalid port mapping')
  })

  it('rejects invalid volume target paths', () => {
    const result = buildContainerRunOptions({
      image: 'nginx:latest',
      name: '',
      ports: [],
      envVars: [],
      volumes: [{ hostPath: '/tmp/data', containerPath: 'data' }],
      autoStart: true
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.title).toBe('Invalid volume mapping')
  })
})
