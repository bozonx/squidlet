import * as yargs from 'yargs';

import MasterConfig from '../configWorks/MasterConfig';
import {getPlatformSystem, readConfig, resolveConfigPath} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import HostFilesSet, {EntitiesSet} from '../configWorks/interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../configWorks/Entities';
import ConfigSetManager from '../host/src/app/interfaces/ConfigSetManager';


const debug: boolean = Boolean(yargs.argv.debug);


/**
 * Get set of entities of specified host
 * @param hostId
 */
function getEntitiesSet(hostId: string): EntitiesSet {
  const result: EntitiesSet = {
    devices: {},
    drivers: {},
    services: {},

    // // parsed manifests
    // entitiesManifests: { devices: {}, drivers: {}, services: {} },
    // // paths to original main files
    // entitiesMains: { devices: {}, drivers: {}, services: {} },
    // // paths to original files
    // entitiesFiles: { devices: {}, drivers: {}, services: {} },
  };

  //const allManifests: AllManifests = this.main.entities.getManifests();
  //const allMains: FilesPaths = this.main.entities.getMainFiles();
  //const allEntitiesFiles: FilesPaths = this.main.entities.getEntitiesFiles();

  // collect manifest names of used entities
  const devicesClasses = this.getDevicesClassNames(hostId);
  const allDriversClasses: string[] = this.getAllUsedDriversClassNames(hostId);
  const servicesClasses: string[] = this.getServicesClassNames(hostId);

  const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
    for (let className of classes) {
      result[pluralType][className] = {
        srcDir: this.main.entities.getSrcDir(pluralType, className),
        manifest: this.main.entities.getManifest(pluralType, className),
        main: this.main.entities.getMainFilePath(pluralType, className),
        files: this.main.entities.getFiles(pluralType, className),
      };
    }
  };

  collect('devices', devicesClasses);
  collect('drivers', allDriversClasses);
  collect('services', servicesClasses);

  return result;
}

/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
function generateMasterConfig(main: Main): HostConfig {
  const hostId = 'master';
  const hostConfig = main.hostsConfigSet.getHostConfig(hostId);
  // TODO: review - use getEntitiesSet
  const configSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    //entities: main.hostsFilesSet.getEntitiesSet(hostId),
  };

  return {
    ...hostConfig,
    config: {
      ...hostConfig.config,
      params: {
        ...hostConfig.config.params,
        configSet,
      }
    }
  };
}


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
async function init () {
  const resolvedConfigPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedConfigPath);
  const main: Main = new Main(config, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();
  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(true);

  // generate master config js object with paths of master host configs and entities files
  const masterHostConfig: HostConfig = generateMasterConfig(main);
  const platformName: string = masterHostConfig.platform;
  const hostSystem: System = getPlatformSystem(platformName);
  const configSetManager: ConfigSetManager = new ConfigSetMaster(masterHostConfig);
  // register config set manager
  hostSystem.$registerConfigSetManager(configSetManager);
  // start master host system
  await hostSystem.start();
}

init()
  .catch((err) => {
    if (debug) {
      throw err;
    }
    else {
      console.error(err.toString());

      process.exit(3);
    }
  });
