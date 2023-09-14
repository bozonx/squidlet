
export const EVENT_DELIMITER = '|'
export const VERSIONS_DIR_NAME = '.versions'
export const WAIT_BEFORE_HALT_MS = 1000
export const CFG_FILE_EXT = 'yml'
export const DEFAULT_UI_HTTP_PORT = 41810
export const DEFAULT_UI_WS_PORT = 41811
export const SERVER_STARTING_TIMEOUT_SEC = 60

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
  // configs of system and apps
  cfg: 'cfg',
  // ro app files
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

export const SYSTEM_CFG_DIR = `/${ROOT_DIRS.cfg}/system`
export const SYSTEM_CONFIG_FILE = `${SYSTEM_CFG_DIR}/system.${CFG_FILE_EXT}`
//export const APP_CONFIG_FILE = `app-config.${CFG_FILE_EXT}`

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

export const IO_NAMES = {
  FilesIo: 'FilesIo',
  HttpClientIo: 'HttpClientIo',
  HttpServerIo: 'HttpServerIo',
  MqttClientIo: 'MqttClientIo',
  WsClientIo: 'WsClientIo',
  WsServerIo: 'WsServerIo',
}

export const DRIVER_NAMES = {
  FilesDriver: 'FilesDriver',
  HttpClientDriver: 'HttpClientDriver',
  HttpServerDriver: 'HttpServerDriver',
  MqttClientDriver: 'MqttClientDriver',
  WsClientDriver: 'WsClientDriver',
  WsServerDriver: 'WsServerDriver',
}
