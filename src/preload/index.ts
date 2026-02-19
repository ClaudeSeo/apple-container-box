/**
 * Preload 스크립트
 * contextBridge를 통해 Renderer에 안전한 API 노출
 */

import { contextBridge, ipcRenderer } from 'electron'

/** IPC 이벤트 리스너 타입 */
type IPCListener<T> = (data: T) => void

/** 구독 해제 함수 */
type Unsubscribe = () => void

/**
 * Container API
 */
const containersAPI = {
  list: (options?: { all?: boolean }) => ipcRenderer.invoke('container:list', options),
  run: (options: {
    image: string
    name?: string
    ports?: string[]
    volumes?: string[]
    env?: Record<string, string>
    labels?: Record<string, string>
    network?: string
    detach?: boolean
    rm?: boolean
    command?: string[]
  }) => ipcRenderer.invoke('container:run', options),
  stop: (id: string, timeout?: number) => ipcRenderer.invoke('container:stop', { id, timeout }),
  start: (id: string) => ipcRenderer.invoke('container:start', { id }),
  restart: (id: string, timeout?: number) =>
    ipcRenderer.invoke('container:restart', { id, timeout }),
  remove: (id: string, force?: boolean) => ipcRenderer.invoke('container:remove', { id, force }),
  inspect: (id: string) => ipcRenderer.invoke('container:inspect', { id }),
  logs: (id: string, options?: { tail?: number; timestamps?: boolean }) =>
    ipcRenderer.invoke('container:logs', { id, ...options }),
  exec: (id: string, command: string[]) => ipcRenderer.invoke('container:exec', { id, command })
}

/**
 * Image API
 */
const imagesAPI = {
  list: () => ipcRenderer.invoke('image:list'),
  pull: (image: string) => ipcRenderer.invoke('image:pull', { image }),
  remove: (id: string, force?: boolean) => ipcRenderer.invoke('image:remove', { id, force }),
  inspect: (id: string) => ipcRenderer.invoke('image:inspect', { id }),
  build: (options: {
    file?: string
    context: string
    tag: string
    buildArgs?: Record<string, string>
    noCache?: boolean
  }) => ipcRenderer.invoke('image:build', options)
}

/**
 * Volume API
 */
const volumesAPI = {
  list: () => ipcRenderer.invoke('volume:list'),
  create: (name: string, driver?: string) => ipcRenderer.invoke('volume:create', { name, driver }),
  remove: (name: string, force?: boolean) => ipcRenderer.invoke('volume:remove', { name, force }),
  inspect: (name: string) => ipcRenderer.invoke('volume:inspect', { name }),
  prune: () => ipcRenderer.invoke('volume:prune')
}

/**
 * Network API
 */
const networksAPI = {
  list: () => ipcRenderer.invoke('network:list'),
  create: (name: string, driver?: string, subnet?: string) =>
    ipcRenderer.invoke('network:create', { name, driver, subnet }),
  remove: (id: string, force?: boolean) => ipcRenderer.invoke('network:remove', { id, force }),
  inspect: (id: string) => ipcRenderer.invoke('network:inspect', { id }),
  connect: (network: string, container: string, options?: { ip?: string; alias?: string[] }) =>
    ipcRenderer.invoke('network:connect', { network, container, ...options }),
  disconnect: (network: string, container: string, force?: boolean) =>
    ipcRenderer.invoke('network:disconnect', { network, container, force })
}

/**
 * 실시간 스트림 API
 */
const streamsAPI = {
  /** 컨테이너 로그 스트림 구독 */
  onLogs: (containerId: string, callback: IPCListener<{ line: string }>): Unsubscribe => {
    const channel = `container:logs:stream:${containerId}`
    const handler = (_event: Electron.IpcRendererEvent, data: { line: string }) => callback(data)
    ipcRenderer.on(channel, handler)

    // 구독 시작 알림
    ipcRenderer.send('stream:subscribe', { type: 'logs', containerId })

    return () => {
      ipcRenderer.removeListener(channel, handler)
      ipcRenderer.send('stream:unsubscribe', { type: 'logs', containerId })
    }
  },

  /** 컨테이너 stats 스트림 구독 */
  onStats: (
    containerId: string,
    callback: IPCListener<{
      cpuPercent: number
      memoryUsage: number
      memoryLimit: number
      networkRx: number
      networkTx: number
      timestamp: number
    }>
  ): Unsubscribe => {
    const channel = `container:stats:stream:${containerId}`
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: {
        cpuPercent: number
        memoryUsage: number
        memoryLimit: number
        networkRx: number
        networkTx: number
        timestamp: number
      }
    ) => callback(data)
    ipcRenderer.on(channel, handler)

    // 구독 시작 알림
    ipcRenderer.send('stream:subscribe', { type: 'stats', containerId })

    return () => {
      ipcRenderer.removeListener(channel, handler)
      ipcRenderer.send('stream:unsubscribe', { type: 'stats', containerId })
    }
  },

  /** Shell exec 세션 구독 */
  onExec: (sessionId: string, callback: IPCListener<{ output: string }>): Unsubscribe => {
    const channel = `exec:output:${sessionId}`
    const handler = (_event: Electron.IpcRendererEvent, data: { output: string }) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.removeListener(channel, handler)
      ipcRenderer.send('exec:close', { sessionId })
    }
  },

  /** Shell exec 입력 전송 */
  sendExecInput: (sessionId: string, data: string) => {
    ipcRenderer.send('exec:input', { sessionId, data })
  },

  /** 이미지 풀 진행 상황 구독 */
  onPullProgress: (
    callback: IPCListener<{
      image: string
      status: string
      current?: number
      total?: number
    }>
  ): Unsubscribe => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { image: string; status: string; current?: number; total?: number }
    ) => callback(data)
    ipcRenderer.on('image:pull:progress', handler)
    return () => {
      ipcRenderer.removeListener('image:pull:progress', handler)
    }
  },

  /** Shell exec 세션 시작 */
  startExec: (containerId: string, command: string[]) =>
    ipcRenderer.invoke('exec:start', { containerId, command })
}

/**
 * System API
 */
const systemAPI = {
  checkCLI: () => ipcRenderer.invoke('system:check-cli'),
  getInfo: () => ipcRenderer.invoke('system:info'),
  getVersion: () => ipcRenderer.invoke('system:version'),
  prune: (options?: { volumes?: boolean }) => ipcRenderer.invoke('system:prune', options),
  getResources: () => ipcRenderer.invoke('system:resources'),

  /** CLI 상태 변경 구독 */
  onCLIStatus: (
    callback: IPCListener<{ connected: boolean; path?: string; error?: string }>
  ): Unsubscribe => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { connected: boolean; path?: string; error?: string }
    ) => callback(data)
    ipcRenderer.on('cli:status', handler)
    return () => {
      ipcRenderer.removeListener('cli:status', handler)
    }
  }
}

/**
 * Settings API
 */
const settingsAPI = {
  get: () => ipcRenderer.invoke('settings:get'),
  set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings),
  reset: () => ipcRenderer.invoke('settings:reset'),
  onChanged: (callback: IPCListener<unknown>): Unsubscribe => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('settings:changed', handler)
    return () => {
      ipcRenderer.removeListener('settings:changed', handler)
    }
  }
}

const trayAPI = {
  onRefreshContainers: (callback: IPCListener<void>): Unsubscribe => {
    const handler = () => callback(undefined)
    ipcRenderer.on('tray:refresh-containers', handler)
    return () => {
      ipcRenderer.removeListener('tray:refresh-containers', handler)
    }
  }
}

/**
 * Window API
 */
const windowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  /** 윈도우 상태 변경 구독 */
  onStateChange: (callback: IPCListener<{ maximized: boolean }>): Unsubscribe => {
    const handler = (_event: Electron.IpcRendererEvent, data: { maximized: boolean }) =>
      callback(data)
    ipcRenderer.on('window:state-change', handler)
    return () => {
      ipcRenderer.removeListener('window:state-change', handler)
    }
  }
}

/**
 * 알림 API
 */
const notificationAPI = {
  onNotification: (
    callback: IPCListener<{
      type: 'info' | 'success' | 'warning' | 'error'
      title: string
      message: string
      timestamp: number
    }>
  ): Unsubscribe => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: {
        type: 'info' | 'success' | 'warning' | 'error'
        title: string
        message: string
        timestamp: number
      }
    ) => callback(data)
    ipcRenderer.on('notification', handler)
    return () => {
      ipcRenderer.removeListener('notification', handler)
    }
  }
}

// Main World에 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  containers: containersAPI,
  images: imagesAPI,
  volumes: volumesAPI,
  networks: networksAPI,
  streams: streamsAPI,
  system: systemAPI,
  settings: settingsAPI,
  tray: trayAPI,
  window: windowAPI,
  notifications: notificationAPI
})
