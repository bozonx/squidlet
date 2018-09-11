import HostConfig from '../../host/src/app/interfaces/HostConfig';
import EntityDefinition from '../../host/src/app/interfaces/EntityDefinition';
import {FilesPaths} from '../Entities';


export interface DefinitionsSet {
  // list of system drivers
  systemDrivers: string[];
  // list of regular drivers
  regularDrivers: string[];
  // list of system services
  systemServices: string[];
  // list of regular services
  regularServices: string[];

  // list of devices definitions
  devicesDefinitions: EntityDefinition[];
  // list of drivers definitions
  driversDefinitions: {[index: string]: EntityDefinition};
  // list of services definitions
  servicesDefinitions: {[index: string]: EntityDefinition};
}


export default interface HostFilesSet extends DefinitionsSet {
  config: HostConfig;
  // files of entities like {devices: {deviceId: [...files]}, drivers, services}
  entitiesFiles: FilesPaths;
}
