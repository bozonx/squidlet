import SystemConfig from '../interfaces/SystemConfig';


const systemConfig: SystemConfig = {
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

  // separator of device id like - room.deviceId
  deviceIdSeparator: '.',
  // delimiter between host id and local device id like "path/to/host$path/to/device"
  deviceHostSeparator: '$',
  topicSeparator: '/',
  eventNameSeparator: '|',
};

export default systemConfig;
