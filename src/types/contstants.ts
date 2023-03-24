export const EVENT_DELIMITER = '|'

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
  db: 'db',
  apps: 'apps',
  appData: 'appData',
  appShared: 'appShared',
  userData: 'userData',
  cache: 'cache',
  log: 'log',
}

export const CFG_DIRS = {
  ios: 'ios',
  drivers: 'drivers',
  services: 'services',
  uiApps: 'uiApps',
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
