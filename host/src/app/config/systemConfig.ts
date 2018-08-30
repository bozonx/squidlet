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
};

export default systemConfig;
