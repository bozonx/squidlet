import {LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {LinuxX86SystemPack} from '../../sysPackages/LinuxX86SystemPack/index.js'
import {ConsoleLoggerPkg} from '../../packages/ConsoleLoggerPkg/index.js'
import {SystemCommonPkg} from '../../packages/SystemCommonPkg/index.js'
import {SystemWithUiPkg} from '../../packages/SystemWithUiPkg/index.js'

const logLevel: LogLevel = process.env.LOG_LEVEL as LogLevel || 'info'

const system = new System()

// use packages
system.use(ConsoleLoggerPkg({ logLevel }))
system.use(LinuxX86SystemPack())
system.use(SystemCommonPkg())
system.use(SystemWithUiPkg())

// init the system
system.init()
// start the system
system.events.once(SystemEvents.systemInited, () => system.start())
system.events.once(SystemEvents.systemStarted, () => {
  // Enable graceful stop
  process.once('SIGINT', () => system.destroy())
  process.once('SIGTERM', () => system.destroy())
})
