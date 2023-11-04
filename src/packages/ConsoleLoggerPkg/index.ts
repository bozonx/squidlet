import {handleLogEvent, ConsoleLogger} from 'squidlet-lib'
import type {LogLevel} from 'squidlet-lib'
import type {PackageContext} from '../../system/package/PackageContext.js'
import type {PackageIndex} from '../../types/types.js'
import {SystemEvents} from '../../types/contstants.js'


export function ConsoleLoggerPkg (options: {logLevel: LogLevel}): PackageIndex {
  const consoleLogger = new ConsoleLogger(options.logLevel)

  return (ctx: PackageContext) => {
    // add console logger
    ctx.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
  }
}
