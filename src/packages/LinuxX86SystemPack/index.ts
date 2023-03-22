import {System} from '../../index.js'
import {SystemEvents} from '../../types/contstants.js'
import {ConsoleLogger} from 'squidlet-lib/lib/index.js'

// TODO: add IoSet
const logLevel = process.env.LOG_LEVEL || undefined
const system = new System()
const logger = new ConsoleLogger(logLevel)
// add console logger
system.events.addListener(SystemEvents.logger, logger.handler)
// init the system
system.init()

// TODO: init
