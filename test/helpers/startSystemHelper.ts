import {LOG_LEVELS} from 'squidlet-lib'
import {ConsoleLoggerPkg} from '../../src/packages/ConsoleLoggerPkg/index.js'
import {PackageContext, System} from '../../src/index.js'
import type {IoIndex} from '../../src/index.js'
import {ioSetLocalPkg} from '../../src/IoSets/IoSetLocal.js'
import {FilesDriverIndex} from '../../src/drivers/FilesDriver/FilesDriver.js'
import {SessionsServiceIndex} from '../../src/services/Sessions/SessionsService.js'
import {ChannelServiceIndex} from '../../src/services/ChannelsService/ChannelsService.js'


export function startSystemHelper(ioStubs: IoIndex[], middleware?: (system: System) => void) {
  const system = new System()

  // use packages
  system.use(ioSetLocalPkg(ioStubs))
  system.use(ConsoleLoggerPkg({logLevel: LOG_LEVELS.error}))
  system.use((ctx: PackageContext) => {
    ctx.useDriver(FilesDriverIndex)
    ctx.useService(SessionsServiceIndex)
    ctx.useService(ChannelServiceIndex)
  })

  middleware?.(system)

  // init the system
  system.init()
  // don't forget to start the system
  return system
}
