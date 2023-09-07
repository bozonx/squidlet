import {LOG_LEVELS, LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {ConsoleLoggerPkg} from '../../packages/ConsoleLoggerPkg/index.js'
import {SystemCommonPkg} from '../../packages/SystemCommonPkg/index.js'
import {SystemWithUiPkg} from '../../packages/SystemWithUiPkg/index.js'
import {ioSetLocalPkg} from '../../IoSets/IoSetLocal.js'
import {FilesIoIndex} from '../../ios/NodejsLinuxPack/FilesIo.js'
import SysInfoIo from '../../ios/NodejsLinuxPack/SysInfoIo.js'
import HttpClientIo from '../../ios/NodejsPack/HttpClientIo.js'
import HttpServerIo from '../../ios/NodejsPack/HttpServerIo.js'
import {WsClientIo} from '../../ios/NodejsPack/WsClientIo.js'
import {WsServerIo} from '../../ios/NodejsPack/WsServerIo.js'


const system = new System()

// use packages
system.use(ioSetLocalPkg([
  FilesIoIndex,
  SysInfoIo,
  HttpClientIo,
  HttpServerIo,
  WsClientIo,
  WsServerIo,
]))
system.use(ConsoleLoggerPkg({logLevel: LOG_LEVELS.debug as LogLevel}))
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
