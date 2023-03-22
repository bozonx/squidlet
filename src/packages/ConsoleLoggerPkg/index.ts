import {
  handleLogEvent,
  ConsoleLogger,
  LogLevel,
} from 'squidlet-lib'
import {PackageContext} from '../../system/package/PackageContext.js'
import {Package} from '../../types/Package.js'
import {SystemEvents} from '../../types/contstants.js'


export function ConsoleLoggerPkg (options: {logLevel: LogLevel}): Package {
  const consoleLogger = new ConsoleLogger(options.logLevel)

  return {
    async install(ctx: PackageContext) {
      // add console logger
      ctx.events.addListener(SystemEvents.logger, handleLogEvent(consoleLogger))
    },
  }
}
