import SystemConfig from '../interfaces/SystemConfig';


const systemConfig: SystemConfig = {
  // dirs of file system root
  rootDirs: {
    // files which received from master
    host: 'host',
    configs: 'configs',
    entities: 'entities',
    // // persistent state of devices
    // devices: 'devices',
    // // persistent state of services
    // services: 'services',
    // // custom data or state of user layer
    // data: 'data',
  },
  hashFiles: {
    host: 'host-hashes.json',
    configs: 'configs-hashes.json',
    entities: 'entities-hashes.json',
  },
  entitiesDirs: {
    // persistent state of devices
    devices: 'devices',
    drivers: 'drivers',
    // persistent state of services
    services: 'services',
  },

  // separator of device id like - room.deviceId
  deviceIdSeparator: '.',
  topicSeparator: '/',
  eventNameSeparator: '|',
};

export default systemConfig;
