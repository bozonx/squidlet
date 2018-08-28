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
    // list of system drivers like {driverName: DriverDefinition}
    systemDrivers: 'systemDrivers.json',
    // list of regular drivers like {driverName: DriverDefinition}
    regularDrivers: 'regularDrivers.json',
    // definitions of devices like DeviceDefinition[]
    devicesDefinitions: 'devicesDefinitions.json',
    // definitions of drivers like {driverName: DriverDefinition}
    driversDefinitions: 'driversDefinitions.json',
    // definitions of services like ServiceDefinition[]
    servicesDefinitions: 'servicesDefinitions.json',
  },
};
