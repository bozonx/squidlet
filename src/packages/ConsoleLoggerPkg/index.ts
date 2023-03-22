import {
  handleLogEvent,
  ConsoleLogger,
  LogLevel,
} from 'squidlet-lib'
import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {SystemEvents} from '../../types/contstants.js'


export function ConsoleLoggerPkg (options: {logLevel: LogLevel}): PackageIndex {
  const consoleLogger = new ConsoleLogger(options.logLevel)

  return (ctx: PackageContext) => {
    // add console logger
    ctx.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
  }
}
