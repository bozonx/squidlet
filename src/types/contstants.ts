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
  registered: 'registered',
  // has not met some dependencies
  noDependencies: 'noDependencies',
  // wait while service which is it depends on will be started
  wait: 'wait',
  // init is in progress
  initializing: 'initializing',
  initialized: 'initialized',
  initError: 'initError',
  starting: 'starting',
  started: 'started',
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
