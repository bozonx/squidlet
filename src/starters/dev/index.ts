import {LOG_LEVELS, LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {DevSystemPack} from '../../sysPackages/DevSystemPack/index.js'
import {ConsoleLoggerPkg} from '../../packages/ConsoleLoggerPkg/index.js'


const system = new System()

// use packages
system.use(ConsoleLoggerPkg({logLevel: LOG_LEVELS.debug as LogLevel}))
system.use(DevSystemPack())

// init the system
system.init()
// start the system
system.events.once(SystemEvents.systemInited, () => system.start())
system.events.once(SystemEvents.systemStarted, () => {
  // Enable graceful stop
  process.once('SIGINT', () => system.destroy())
  process.once('SIGTERM', () => system.destroy())
})
