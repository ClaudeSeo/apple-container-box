/**
 * CLI 모듈 통합 export
 */

export type {
  ContainerCLIAdapter,
  CLIContainer,
  CLIContainerStats,
  CLIImage,
  CLIVolume,
  CLINetwork,
  ContainerRunOptions,
  ImageBuildOptions
} from './adapter.interface'

export { RealContainerCLI } from './real-cli.adapter'
export { MockContainerCLI } from './mock-cli.adapter'
export { createCLIAdapter, getCLIAdapter, resetCLIAdapter, isMockMode } from './cli-factory'

export { CLIError, CLIErrorCode } from './types'
export type { CLIExecOptions, CLIExecResult, CLIParseResult, PullProgressEvent, BuildProgressEvent, ProgressPhase } from './types'

export {
  validateName,
  validateImageRef,
  validatePortMapping,
  validateVolumeMount,
  validateEnvVars,
  validateContainerId,
  sanitizeShellArg,
  ValidationError
} from './validator'

export {
  parseContainerList,
  parseImageList,
  parseVolumeList,
  parseNetworkList,
  parseNetworkInspect,
  parseContainerStats,
  parseErrorCode,
  parseJSON
} from './parser'
