/**
 * 서비스 모듈 통합 export
 */

export { containerService } from './container.service'
export { imageService } from './image.service'
export { volumeService } from './volume.service'
export { networkService } from './network.service'
export { systemService } from './system.service'
export { streamService } from './stream.service'
export { pollingService } from './polling.service'

import { containerService } from './container.service'
import { imageService } from './image.service'
import { volumeService } from './volume.service'
import { networkService } from './network.service'
import { systemService } from './system.service'
import { streamService } from './stream.service'
import { pollingService } from './polling.service'

export function resetAllServiceAdapters(): void {
  containerService.resetAdapter()
  imageService.resetAdapter()
  volumeService.resetAdapter()
  networkService.resetAdapter()
  systemService.resetAdapter()
  streamService.resetAdapter()
  pollingService.resetAdapter()
}
