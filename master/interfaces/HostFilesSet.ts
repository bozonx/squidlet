import HostConfig from '../../host/src/app/interfaces/HostConfig';
import EntityDefinition from '../../host/src/app/interfaces/EntityDefinition';
import {FilesPaths} from '../Entities';


export default interface HostFilesSet {
  config: HostConfig;

  // files of entities like {devices: {deviceId: [...files]}, drivers, services}
  entitiesFiles: FilesPaths;

  systemDrivers: string[];
  regularDrivers: string[];
  systemServices: string[];
  regularServices: string[];

  devicesDefinitions: EntityDefinition[];
  // by driver name
  driversDefinitions: {[index: string]: EntityDefinition};
  // by service id
  servicesDefinitions: {[index: string]: EntityDefinition};
}
