import * as path from 'path';
import _values = require('lodash/values');

import BuildHostsEnv from './BuildHostsEnv';
import {EntitiesSet, SrcEntitiesSet} from '../../host/src/app/interfaces/EntitySet';
import {EntitiesNames} from './Entities';
import DefinitionsSet from '../../host/src/app/interfaces/DefinitionsSet';
import {sortByIncludeInList} from './helpers';
import {ManifestsTypePluralName} from '../../host/src/app/interfaces/ManifestTypes';


export default class HostsFilesSet {
  private readonly main: BuildHostsEnv;

  constructor(main: BuildHostsEnv) {
    this.main = main;
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
      devicesDefinitions: _values(this.main.definitions.getHostDevicesDefinitions(hostId)),
      driversDefinitions: this.main.definitions.getHostDriversDefinitions(hostId),
      servicesDefinitions: this.main.definitions.getHostServicesDefinitions(hostId),
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

    const usedEntitiesNames: EntitiesNames = this.main.hostClassNames.getEntitiesNames(hostId);

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        const srcDir = this.main.entities.getSrcDir(pluralType, className);
        const relativeMain: string | undefined = this.main.entities.getMainFilePath(pluralType, className);
        const relativeFiles: string[] = this.main.entities.getFiles(pluralType, className);

        result[pluralType][className] = {
          srcDir,
          manifest: this.main.entities.getManifest(pluralType, className),
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

  generateDstEntitiesSet(main: BuildHostsEnv, hostId: string): EntitiesSet {
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
    const driversClasses: string[] = this.main.hostClassNames.getAllUsedDriversClassNames(hostId);
    const allSystemDrivers: string[] = this.main.entities.getSystemDrivers();

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(hostId: string): [string[], string[]] {
    const servicesClasses: string[] = this.main.hostClassNames.getServicesClassNames(hostId);
    const allSystemServices: string[] = this.main.entities.getSystemServices();

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}
