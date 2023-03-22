import {ConsoleLogger, LOG_LEVELS, handleLogEvent, LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {DevSystemPack} from '../../sysPackages/DevSystemPack/index.js'


const system = new System()
const consoleLogger = new ConsoleLogger(LOG_LEVELS.debug as LogLevel)
// add console logger
system.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
// use packages
system.use(DevSystemPack())
// init the system
system.init()

system.events.once(SystemEvents.systemInited, () => system.start())

// Enable graceful stop
process.once('SIGINT', () => system.destroy())
process.once('SIGTERM', () => system.destroy())
