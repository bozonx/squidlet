import HostConfig from '../../host/src/app/interfaces/HostConfig';
import EntityDefinition from '../../host/src/app/interfaces/EntityDefinition';
import {FilesPaths} from '../Entities';
import ManifestBase from '../../host/src/app/interfaces/ManifestBase';


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

export interface EntitiesSet extends DefinitionsSet {
  // TODO: review
  entitiesManifests: {[index: string]: {[index: string]: ManifestBase}};
  entitiesMains: {};
  // original files of entities like {devices: {deviceId: [...files]}, drivers, services}
  srcEntitiesFiles: FilesPaths;
  // files of entities in storage like {devices: {deviceId: [...files]}, drivers, services}
  dstEntitiesFiles: FilesPaths;
  // js manifests of entities
}


export default interface HostFilesSet extends EntitiesSet {
  config: HostConfig;

}
