/**
 * This is system config for master configurator and host
 */

// TODO: расформировать

//import initializationConfig from '../../system/initializationConfig';
//import InitializationConfig from '../../system/interfaces/InitializationConfig';
import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';


//const hostInitCfg: InitializationConfig = initializationConfig();

export default {
  //hostInitCfg,
  hostSysCfg: systemConfig,

  indexManifestFileNames: ['manifest.yaml'],
  // dir in storage where will be generated devices, drivers and services main files
  //entityBuildDir: 'entities',
  //entitiesFile: 'entitiesFiles.json',
  //usedEntitiesNamesFile: 'usedEntities.json',
  //pathToSaveHostsFileSet: 'hosts',
  //pathToSaveHostsFileSet: `${hostInitCfg.hostDirs.services}/ConfigUpdater/hosts`,
};
