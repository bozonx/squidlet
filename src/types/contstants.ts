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
