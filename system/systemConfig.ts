const systemConfig = {
  // default root dirs on micro controller
  rootDirs: {
    envSet: 'envSet',
    varData: 'varData',
    tmp: 'tmp',
  },
  // dirs of file system root
  envSetDirs: {
    // files which received from master
    system: 'system',
    configs: 'configs',
    entities: 'entities',
    ios: 'ios',
  },
  // dirs under varDataDir which is set in host config
  storageDirs: {
    var: 'var',
    cache: 'cache',
    logs: 'logs',
  },
  // entitiesDirs: {
  //   // persistent state of devices
  //   devices: 'devices',
  //   drivers: 'drivers',
  //   // persistent state of services
  //   services: 'services',
  // },

  fileNames: {
    hostConfig: 'config.json',
    manifest: 'manifest.json',
    // name of built main file of entity
    //mainJs: '__main.js',
    // list of system drivers like driverName[]
    driversList: 'driversList.json',
    // list of system services like serviceId[]
    servicesList: 'servicesList.json',
    // definitions of devices like DeviceDefinition[]
    devicesDefinitions: 'devicesDefinitions.json',
    // definitions of drivers like {driverName: DriverDefinition}
    driversDefinitions: 'driversDefinitions.json',
    // definitions of services like {serviceId: ServiceDefinition}
    servicesDefinitions: 'servicesDefinitions.json',
    // params which will be sent to platforms.init()
    iosDefinitions: 'iosDefinitions.json',
  },
};

export default systemConfig;
