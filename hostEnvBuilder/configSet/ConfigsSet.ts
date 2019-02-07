import * as path from 'path';
import _values = require('lodash/values');

import SrcEntitiesSet from '../interfaces/SrcEntitiesSet';
import {EntitiesNames} from '../entities/EntitiesCollection';
import {sortByIncludeInList} from '../helpers';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import HostClassNames from './HostClassNames';
import Definitions from './Definitions';
import EntitiesCollection from '../entities/EntitiesCollection';
import ConfigManager from '../ConfigManager';
import HostConfigSet from '../interfaces/HostConfigSet';


export default class ConfigsSet {
  private readonly configManager: ConfigManager;
  private readonly entitiesCollection: EntitiesCollection;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;


  constructor(
    configManager: ConfigManager,
    entitiesCollection: EntitiesCollection,
    hostClassNames: HostClassNames,
    definitions: Definitions
  ) {
    this.configManager = configManager;
    this.entitiesCollection = entitiesCollection;
    this.hostClassNames = hostClassNames;
    this.definitions = definitions;
  }

  getConfigSet(): HostConfigSet {
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers();
    const [
      systemServices,
      regularServices,
    ] = this.sortServices();

    return {
      config: this.configManager.hostConfig,
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.definitions.getHostDevicesDefinitions()),
      driversDefinitions: this.definitions.getHostDriversDefinitions(),
      servicesDefinitions: this.definitions.getHostServicesDefinitions(),
    };
  }

  /**
   * Get set of entities of specified host with absolute path to source files.
   */
  generateSrcEntitiesSet(): SrcEntitiesSet {
    const result: SrcEntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };

    // TODO: review
    // TODO: можеть сделать ввиде виртуальной фс ?

    const usedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames();

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        const srcDir = this.entitiesCollection.getSrcDir(pluralType, className);
        const relativeMain: string | undefined = this.entitiesCollection.getMainFilePath(pluralType, className);
        const relativeFiles: string[] = this.entitiesCollection.getFiles(pluralType, className);

        result[pluralType][className] = {
          srcDir,
          manifest: this.entitiesCollection.getManifest(pluralType, className),
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
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(): [string[], string[]] {
    const driversClasses: string[] = this.hostClassNames.getAllUsedDriversClassNames();
    const allSystemDrivers: string[] = this.entitiesCollection.getSystemDrivers();

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(): [string[], string[]] {
    const servicesClasses: string[] = this.hostClassNames.getServicesClassNames();
    const allSystemServices: string[] = this.entitiesCollection.getSystemServices();

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}

// generateDstEntitiesSet(hostId: string): EntitiesSet {
//   const result: EntitiesSet = {
//     devices: {},
//     drivers: {},
//     services: {},
//   };
//
//   return result;
// }
