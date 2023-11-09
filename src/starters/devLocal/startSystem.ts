import {LOG_LEVELS} from 'squidlet-lib'
import type {LogLevel} from 'squidlet-lib'
import {System} from '../../index.js'
import {SystemEvents} from '../../types/constants.js'
import {ConsoleLoggerPkg} from '../../packages/ConsoleLoggerPkg/index.js'
import {SystemCommonPkg} from '../../packages/SystemCommonPkg/index.js'
import {SystemWithUiPkg} from '../../packages/SystemWithUiPkg/index.js'
import {ioSetLocalPkg} from '../../IoSets/IoSetLocal.js'
import {FilesIoIndex} from '../../ios/NodejsLinuxPack/FilesIo.js'
import {SysInfoIoIndex} from '../../ios/NodejsLinuxPack/SysInfoIo.js'
import {HttpClientIoIndex} from '../../ios/NodejsPack/HttpClientIo.js'
import {HttpServerIoIndex} from '../../ios/NodejsPack/HttpServerIo.js'
import {WsClientIoIndex} from '../../ios/NodejsPack/WsClientIo.js'
import {WsServerIoIndex} from '../../ios/NodejsPack/WsServerIo.js'
import {SystemExtraPkg} from '../../packages/SystemExtraPkg/index.js'


export function startSystem(middleware?: (system: System) => void) {
  const system = new System()

  // use packages
  system.use(ioSetLocalPkg([
    FilesIoIndex,
    SysInfoIoIndex,
    HttpClientIoIndex,
    HttpServerIoIndex,
    WsClientIoIndex,
    WsServerIoIndex,
  ]))
  system.use(ConsoleLoggerPkg({logLevel: LOG_LEVELS.debug as LogLevel}))
  system.use(SystemCommonPkg())
  system.use(SystemExtraPkg())
  system.use(SystemWithUiPkg())

  middleware?.(system)

  // init the system
  system.init()
  // start the system
  system.events.once(SystemEvents.systemInited, () => system.start())
  system.events.once(SystemEvents.systemStarted, () => {
    // Enable graceful stop
    process.once('SIGINT', () => system.destroy())
    process.once('SIGTERM', () => system.destroy())
  })
}
