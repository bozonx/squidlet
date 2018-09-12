import * as yargs from 'yargs';
import * as path from 'path';

import MasterConfig from '../configWorks/MasterConfig';
import {getPlatformSystem, readConfig, resolveConfigPath} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import {EntitiesSet} from '../configWorks/interfaces/EntitySet';
import {EntitiesNames, ManifestsTypePluralName} from '../configWorks/Entities';
import ConfigSetManager from '../host/src/app/interfaces/ConfigSetManager';
import DefinitionsSet from '../configWorks/interfaces/DefinitionsSet';


const debug: boolean = Boolean(yargs.argv.debug);

interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
}


/**
 * Get set of entities of specified host
 */
function generateEntitiesSet(main: Main, hostId: string): EntitiesSet {
  const result: EntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  const usedEntitiesNames: EntitiesNames = main.hostsFilesSet.getEntitiesNames(hostId);

  const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
    for (let className of classes) {
      const srcDir = main.entities.getSrcDir(pluralType, className);
      const relativeMain: string | undefined = main.entities.getMainFilePath(pluralType, className);
      const relativeFiles: string[] = main.entities.getFiles(pluralType, className);

      result[pluralType][className] = {
        manifest: main.entities.getManifest(pluralType, className),
        main: relativeMain && path.resolve(srcDir, relativeMain),
        files: relativeFiles.map((relativeFileName: string) => path.resolve(srcDir, relativeFileName)),
      };
    }
  };

  collect('devices', usedEntitiesNames.devices);
  collect('drivers', usedEntitiesNames.drivers);
  collect('services', usedEntitiesNames.services);

  return result;
}

/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
function generateMasterConfig(main: Main): HostConfig {
  const hostId = 'master';
  const hostConfig = main.hostsConfigSet.getHostConfig(hostId);
  const configSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    entitiesSet: generateEntitiesSet(main, hostId),
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
