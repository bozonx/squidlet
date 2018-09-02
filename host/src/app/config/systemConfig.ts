import SystemConfig from '../interfaces/SystemConfig';
import PreDeviceDefinition from '../../../../master/interfaces/PreDeviceDefinition';


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

  // separator of
  deviceIdSeparator: '.',
};

export default systemConfig;
