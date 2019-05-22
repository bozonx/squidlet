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
  deviceIdSeparator: '.',
  topicSeparator: '/',
  eventNameSeparator: '|',

  channels: {
    network: 255,
  },
};

export default systemConfig;
