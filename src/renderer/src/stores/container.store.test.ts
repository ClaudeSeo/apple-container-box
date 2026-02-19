import { describe, expect, it } from 'vitest'
import { selectContainerStats, selectFilteredContainers } from './container.store'
import type { Container } from '../types'

const MOCK_CONTAINERS: Container[] = [
  {
    id: 'abc123',
    name: 'web',
    image: 'nginx:latest',
    status: 'running',
    createdAt: '2026-01-01T00:00:00.000Z',
    ports: [],
    mounts: [],
    env: {},
    labels: {}
  },
  {
    id: 'def456',
    name: 'db',
    image: 'postgres:16',
    status: 'stopped',
    createdAt: '2026-01-01T00:00:00.000Z',
    ports: [],
    mounts: [],
    env: {},
    labels: {}
  }
]

describe('selectFilteredContainers', () => {
  it('filters by search query', () => {
    const result = selectFilteredContainers(MOCK_CONTAINERS, 'post')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('def456')
  })

  it('filters by status', () => {
    const result = selectFilteredContainers(MOCK_CONTAINERS, '', 'running')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('abc123')
  })
})

describe('selectContainerStats', () => {
  it('aggregates status counts', () => {
    expect(selectContainerStats(MOCK_CONTAINERS)).toEqual({
      total: 2,
      running: 1,
      stopped: 1,
      paused: 0
    })
  })
})
