export default {
  // dirs of file system root
  rootDirs: {
    // files which received from master
    host: 'host',
    // persistent state of devices
    devices: 'devices',
    // persistent state of services
    services: 'services',
    // custom data or state of user layer
    data: 'data',
  },
  // dirs of host dir
  hostDirs: {
    config: 'config',
    devices: 'devices',
    drivers: 'drivers',
    services: 'services',
  },
  fileNames: {
    hostConfig: 'hostConfig.json',
    manifest: 'manifest.json',
    systemDrivers: 'systemDrivers.json',
    regularDrivers: 'regularDrivers.json',
    devicesDefinitions: 'devicesDefinitions.json',
    driversDefinitions: 'driversDefinitions.json',
    servicesDefinitions: 'servicesDefinitions.json',
  },
};
