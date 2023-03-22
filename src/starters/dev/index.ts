import {ConsoleLogger, LOG_LEVELS, handleLogEvent, LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {IoSetDev} from '../../system/Io/IoSetDev.js'
import {SystemEvents} from '../../types/contstants.js'


const ioSetDev = new IoSetDev()
const system = new System(ioSetDev)
const consoleLogger = new ConsoleLogger(LOG_LEVELS.debug as LogLevel)
// add console logger
system.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
// init the system
system.init()

system.events.once(SystemEvents.systemInited, () => system.start())

// Enable graceful stop
process.once('SIGINT', () => system.destroy())
process.once('SIGTERM', () => system.destroy())
