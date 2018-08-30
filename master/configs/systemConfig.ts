/**
 * This is system config for master configurator and host
 */

import initializationConfig from '../../host/src/app/initializationConfig';
import InitializationConfig from '../../host/src/app/interfaces/InitializationConfig';


const hostInitCfg: InitializationConfig = initializationConfig();

export default {
  // // dirs of host dir
  // hostDirs: {
  //   config: 'config',
  //   devices: 'devices',
  //   drivers: 'drivers',
  //   services: 'services',
  // },
  // fileNames: {
  //   hostConfig: 'hostConfig.json',
  // },

  hostInitCfg,

  entityBuildDir: 'entityBuild',
  pathToSaveHostsFileSet: 'hosts',
  //pathToSaveHostsFileSet: 'services/ConfigUpdater/hosts',
};
