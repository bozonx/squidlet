import * as path from 'path';
import _values = require('lodash/values');

import {EntitiesSet, SrcEntitiesSet} from '../../../host/interfaces/EntitySet';
import {EntitiesNames} from '../entities/EntitiesCollection';
import DefinitionsSet from '../../../host/interfaces/DefinitionsSet';
import {sortByIncludeInList} from '../helpers';
import {ManifestsTypePluralName} from '../../../host/interfaces/ManifestTypes';
import HostClassNames from './HostClassNames';
import Definitions from './Definitions';
import EntitiesCollection from '../entities/EntitiesCollection';


export default class HostsFilesSet {
  private readonly entitiesCollection: EntitiesCollection;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;


  constructor(entitiesCollection: EntitiesCollection, hostClassNames: HostClassNames, definitions: Definitions) {
    this.entitiesCollection = entitiesCollection;
    this.hostClassNames = hostClassNames;
    this.definitions = definitions;
  }

  getDefinitionsSet(hostId: string): DefinitionsSet {
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers(hostId);
    const [
      systemServices,
      regularServices,
    ] = this.sortServices(hostId);

    return {
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.definitions.getHostDevicesDefinitions(hostId)),
      driversDefinitions: this.definitions.getHostDriversDefinitions(hostId),
      servicesDefinitions: this.definitions.getHostServicesDefinitions(hostId),
    };
  }

  /**
   * Get set of entities of specified host with absolute path to source files.
   */
  generateSrcEntitiesSet(hostId: string): SrcEntitiesSet {
    const result: SrcEntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };

    // TODO: review
    // TODO: можеть сделать ввиде виртуальной фс ?

    const usedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames(hostId);

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

  generateDstEntitiesSet(hostId: string): EntitiesSet {
    const result: EntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };

    // TODO: move to HostsFilesSet
    // TODO: make requireJs paths
    // TODO: test it

    return result;
  }


  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(hostId: string): [string[], string[]] {
    const driversClasses: string[] = this.hostClassNames.getAllUsedDriversClassNames(hostId);
    const allSystemDrivers: string[] = this.entitiesCollection.getSystemDrivers();

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(hostId: string): [string[], string[]] {
    const servicesClasses: string[] = this.hostClassNames.getServicesClassNames(hostId);
    const allSystemServices: string[] = this.entitiesCollection.getSystemServices();

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}
