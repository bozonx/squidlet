export const EVENT_DELIMITER = '|'
export const VERSIONS_DIR_NAME = '.versions'
export const WAIT_BEFORE_HALT_MS = 1000

export enum SystemEvents {
  // driversInitialized,
  // servicesInitialized,
  // devicesInitialized,
  // appInitialized,
  // beforeDestroy,
  logger,
  systemInited,
  systemStarted,
  systemDestroying,
}

export enum RootEvents {
  service,
}

export enum ServiceEvents {
  status,
}

export const ROOT_DIRS = {
  cfg: 'cfg',
  appFiles: 'appFiles',
  appDataLocal: 'appDataLocal',
  appDataSynced: 'appDataSynced',
  db: 'db',
  cache: 'cache',
  log: 'log',
  tmp: 'tmp',
  userData: 'userData',
  //external: 'external',
}

export const SYSTEM_CFG_DIR = `${ROOT_DIRS.cfg}/system`
export const SYSTEM_CONFIG_FILE = `${SYSTEM_CFG_DIR}/system.yml`

export const CFG_DIRS = {
  ios: 'ios',
  drivers: 'drivers',
  services: 'services',
}

export const SERVICE_STATUS = {
  // just instantiated
  loaded: 'loaded',
  // has not met some dependencies. Service has been destroyed and removed in this case
  noDependencies: 'noDependencies',
  // wait while service which is it depends on will be started
  wait: 'wait',
  // was falled if it was in running state
  fallen: 'fallen',
  // init is in progress
  initializing: 'initializing',
  initialized: 'initialized',
  initError: 'initError',
  starting: 'starting',
  // after successfully run
  running: 'running',
  startError: 'startError',
  stopping: 'stopping',
  stopped: 'stopped',
  stopError: 'stopError',
  destroying: 'destroying',
  destroyed: 'destroyed',
}

export const SERVICE_DESTROY_REASON = {
  noDependencies: 'noDependencies',
  systemDestroying: 'systemDestroying',
}

export const SERVICE_TYPES = {
  service: 'service',
  target: 'target',
  oneshot: 'oneshot', // может быть таймаут запуска
  interval: 'interval', // переодично запускается типа cron
}

export const SERVICE_TARGETS = {
  // only for system low level services
  root: 'root',
  // for not system services
  systemInitialized: 'systemInitialized',
}
