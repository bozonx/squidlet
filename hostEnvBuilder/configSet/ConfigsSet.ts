import HostEntitySet from '../interfaces/HostEntitySet';
import {sortByIncludeInList} from '../helpers';
import Definitions from './Definitions';
import ConfigManager from '../hostConfig/ConfigManager';
import HostConfigSet from '../interfaces/HostConfigSet';
import UsedEntities from '../entities/UsedEntities';


export default class ConfigsSet {
  private readonly configManager: ConfigManager;
  private readonly usedEntities: UsedEntities;
  private readonly definitions: Definitions;


  constructor(configManager: ConfigManager, usedEntities: UsedEntities, definitions: Definitions) {
    this.configManager = configManager;
    this.usedEntities = usedEntities;
    this.definitions = definitions;
  }


  getConfigSet(): HostConfigSet {
    const driversList: string[] = this.sortDrivers();
    const servicesList: string[] = this.sortServices();

    return {
      config: this.configManager.hostConfig,
      driversList,
      servicesList,
      devicesDefinitions: Object.values(this.definitions.getDevicesDefinitions()),
      driversDefinitions: this.definitions.getDriversDefinitions(),
      servicesDefinitions: this.definitions.getServicesDefinitions(),
      iosDefinitions: this.definitions.getIosDefinitions(),
    };
  }

  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(): string[] {
    const driversClasses: string[] = this.usedEntities.getEntitiesNames().drivers;
    const allSystemDrivers: string[] = [];

    for (let driverName of driversClasses) {
      const entitySet: HostEntitySet = this.usedEntities.getEntitySet('driver', driverName);

      if (entitySet.system) allSystemDrivers.push(driverName);
    }

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(): string[] {
    const servicesClasses: string[] = this.usedEntities.getEntitiesNames().services;
    const allSystemServices: string[] = [];

    for (let serviceName of servicesClasses) {
      const entitySet: HostEntitySet = this.usedEntities.getEntitySet('service', serviceName);

      if (entitySet.system) allSystemServices.push(serviceName);
    }

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}

// /**
//  * Get set of entities of specified host with absolute path to source files.
//  */
// generateSrcEntitiesSet(): SrcEntitiesSet {
//   const result: SrcEntitiesSet = {
//     devices: {},
//     drivers: {},
//     services: {},
//   };
//   const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();
//
//   const collect = (pluralType: EntityTypePlural, classes: string[]) => {
//     for (let className of classes) {
//       const entitySet: SrcEntitySet = this.usedEntities.getEntitySet(pluralType, className);
//
//       result[pluralType][className] = entitySet;
//
//       // result[pluralType][className] = {
//       //   ...entitySet,
//       //   files: entitySet.files.map((relativeFileName: string) => path.resolve(entitySet.srcDir, relativeFileName)),
//       //   manifest: {
//       //     ...entitySet.manifest,
//       //     main: path.join(entitySet.srcDir, entitySet.manifest.main),
//       //   },
//       // };
//     }
//   };
//
//   collect('devices', usedEntitiesNames.devices);
//   collect('drivers', usedEntitiesNames.drivers);
//   collect('services', usedEntitiesNames.services);
//
//   return result;
// }
