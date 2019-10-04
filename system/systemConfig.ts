const systemConfig = {
  // default root dirs on micro controller
  rootDirs: {
    envSet: '/envSet',
    varData: '/varData',
    tmp: '/tmp',
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
    common: 'common',
    cache: 'cache',
    logs: 'logs',
  },
  // hashFiles: {
  //   host: 'host-hashes.json',
  //   configs: 'configs-hashes.json',
  //   entities: 'entities-hashes.json',
  // },
  // entitiesDirs: {
  //   // persistent state of devices
  //   devices: 'devices',
  //   drivers: 'drivers',
  //   // persistent state of services
  //   services: 'services',
  // },

  // separator of device id like - room.deviceId
  // TODO: remove - use constant
  deviceIdSeparator: '.',
  //topicSeparator: '/',
  //eventNameSeparator: '|',

  // channels: {
  //   network: 255,
  // },

  fileNames: {
    hostConfig: 'config.json',
    manifest: 'manifest.json',
    // name of built main file of entity
    //mainJs: '__main.js',

    // list of system drivers like driverName[]
    systemDrivers: 'systemDrivers.json',
    // list of regular drivers like driverName[]
    regularDrivers: 'regularDrivers.json',

    // list of system services like serviceId[]
    systemServices: 'systemServices.json',
    // list of regular services like serviceId[]
    regularServices: 'regularServices.json',

    // definitions of devices like DeviceDefinition[]
    devicesDefinitions: 'devicesDefinitions.json',
    // definitions of drivers like {driverName: DriverDefinition}
    driversDefinitions: 'driversDefinitions.json',
    // definitions of services like {serviceId: ServiceDefinition}
    servicesDefinitions: 'servicesDefinitions.json',
    // params which will be sent to dev.configure()
    iosDefinitions: 'iosDefinitions.json',
  },
};

export default systemConfig;
