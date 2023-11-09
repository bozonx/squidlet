
export const EVENT_DELIMITER = '|'
export const VERSIONS_DIR_NAME = '.versions'
export const WAIT_BEFORE_HALT_MS = 1000
export const CFG_FILE_EXT = 'yml'
export const LOCAL_HOST = 'localhost'
// port for connections with other squidlets
export const DEFAULT_WS_CONNECT_PORT = 41808
// port for squidletctrl
export const DEFAULT_WS_CTRL_PORT = 41809
export const DEFAULT_UI_HTTP_PORT = 41810
export const DEFAULT_UI_WS_PORT = 41811
export const SERVER_STARTING_TIMEOUT_SEC = 60
export const REQUEST_ID_LENGTH = 8

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

export enum NETWORK_CODES {
  success,
  badRequest,
  // error of remote method
  payloadHandlerError,
  // error while request or response process
  fatalError,
  noCategory,
}

// real root dirs
export const ROOT_DIRS = {
  // ro app files
  appFiles: 'appFiles',
  appDataLocal: 'appDataLocal',
  appDataSynced: 'appDataSynced',
  cacheLocal: 'cacheLocal',
  // configs of system and apps
  cfgLocal: 'cfgLocal',
  cfgSynced: 'cfgSynced',
  db: 'db',
  log: 'log',
  tmpLocal: 'tmpLocal',
  home: 'home',
}
// virtual external root dir
export const EXTERNAL_ROOT_DIR = 'external'

export const SYSTEM_DIR = 'system'
export const COMMON_DIR = 'common'
export const SYSTEM_CFG_DIR = `/${ROOT_DIRS.cfgLocal}/${SYSTEM_DIR}`
export const SYSTEM_CONFIG_FILE = `${SYSTEM_CFG_DIR}/${SYSTEM_DIR}.${CFG_FILE_EXT}`
//export const APP_CONFIG_FILE = `app-config.${CFG_FILE_EXT}`
export const APP_FILES_PUBLIC_DIR = 'public'

export const SYSTEM_SUB_DIRS = {
  ios: 'ios',
  drivers: 'drivers',
  services: 'services',
}
export const HOME_SUB_DIRS = {
  '.trash': '.trash',
  '.versions': '.versions',
  _Apps: '_Apps',
  _Downloads: '_Downloads',
  _Media: '_Media',
  _Mnt: '_Mnt',
  _Tmp: '_Tmp',
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

// system services which have api
export const SYSTEM_SERVICE_NAMES = {
  Network: 'Network',
  PublicApiService: 'PublicApiService',
  Sessions: 'Sessions',
}
