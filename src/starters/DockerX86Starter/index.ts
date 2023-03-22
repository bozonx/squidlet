import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {ConsoleLogger, LogLevel, handleLogEvent} from 'squidlet-lib'
import {IoSetProd} from '../../system/Io/IoSetProd.js'


const ioSetProd = new IoSetProd()
const logLevel: LogLevel = process.env.LOG_LEVEL as LogLevel || 'info'
const system = new System(ioSetProd)
const consoleLogger = new ConsoleLogger(logLevel)
// add console logger
system.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
// init the system
system.init()

system.events.once(SystemEvents.systemInited, () => system.start())

// Enable graceful stop
process.once('SIGINT', () => system.destroy())
process.once('SIGTERM', () => system.destroy())
