/**
 * This is system config for master configurator and host
 */

import initializationConfig from '../../../host/config/initializationConfig';
import InitializationConfig from '../../../host/interfaces/InitializationConfig';
import systemConfig from '../../../host/config/systemConfig';
import SystemConfig from '../../../host/interfaces/SystemConfig';


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
