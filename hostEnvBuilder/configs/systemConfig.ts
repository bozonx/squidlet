/**
 * This is system config for master configurator and host
 */

import initializationConfig from '../../system/config/initializationConfig';
import InitializationConfig from '../../system/interfaces/InitializationConfig';
import systemConfig from '../../system/config/systemConfig';


const hostInitCfg: InitializationConfig = initializationConfig();

export default {
  hostInitCfg,
  hostSysCfg: systemConfig,

  indexManifestFileNames: ['manifest.yaml'],
  // dir in storage where will be generated devices, drivers and services main files
  //entityBuildDir: 'entities',
  //entitiesFile: 'entitiesFiles.json',
  //usedEntitiesNamesFile: 'usedEntities.json',
  //pathToSaveHostsFileSet: 'hosts',
  //pathToSaveHostsFileSet: `${hostInitCfg.hostDirs.services}/ConfigUpdater/hosts`,
};
