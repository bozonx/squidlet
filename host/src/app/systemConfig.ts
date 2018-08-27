export default {
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
  hostDirs: {
    config: 'config',
    devices: 'devices',
    drivers: 'drivers',
    services: 'services',
  },
  fileNames: {
    hostConfig: 'hostConfig.json',
  },
};
