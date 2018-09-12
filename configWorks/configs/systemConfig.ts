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
  // dir in storage where will be generated devices, drivers and services main files
  entityBuildDir: 'entities',
  //entitiesFile: 'entitiesFiles.json',
  usedEntitiesNamesFile: 'usedEntities.json',
  pathToSaveHostsFileSet: 'hosts',
  //pathToSaveHostsFileSet: `${hostInitCfg.hostDirs.services}/ConfigUpdater/hosts`,
  filesEncode: 'utf8',
};
