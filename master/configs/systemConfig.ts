/**
 * This is system config for master configurator and host
 */

import initializationConfig from '../../host/src/app/config/initializationConfig';
import InitializationConfig from '../../host/src/app/interfaces/InitializationConfig';
import systemConfig from '../../host/src/app/config/systemConfig';
import SystemConfig from '../../host/src/app/interfaces/SystemConfig';


const hostInitCfg: InitializationConfig = initializationConfig();
const hostSysCfg: SystemConfig = systemConfig;

export default {
  hostInitCfg,
  hostSysCfg,

  defaultDuildDir: '~/.squidlet/build',
  indexManifestFileNames: ['manifest.yaml'],
  entityBuildDir: 'entityBuild',
  //pathToSaveHostsFileSet: 'hosts',
  pathToSaveHostsFileSet: `${hostInitCfg.hostDirs.services}/ConfigUpdater/hosts`,
};
