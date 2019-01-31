/**
 * This is system config for master configurator and host
 */

import initializationConfig from '../../../host/core/config/initializationConfig';
import InitializationConfig from '../../../host/core/interfaces/InitializationConfig';
import systemConfig from '../../../host/core/config/systemConfig';
import SystemConfig from '../../../host/core/interfaces/SystemConfig';


const hostInitCfg: InitializationConfig = initializationConfig();
const hostSysCfg: SystemConfig = systemConfig;

export default {
  hostInitCfg,
  hostSysCfg,

  defaultBuildDir: '~/.squidlet/build',
  indexManifestFileNames: ['manifest.yaml'],
  // dir in storage where will be generated devices, drivers and services main files
  entityBuildDir: 'entities',
  //entitiesFile: 'entitiesFiles.json',
  usedEntitiesNamesFile: 'usedEntities.json',
  pathToSaveHostsFileSet: 'hosts',
  //pathToSaveHostsFileSet: `${hostInitCfg.hostDirs.services}/ConfigUpdater/hosts`,
  filesEncode: 'utf8',
};
