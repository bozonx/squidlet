import HostConfig from '../../host/src/app/interfaces/HostConfig';
import EntityDefinition from '../../host/src/app/interfaces/EntityDefinition';
import {AllManifests, FilesPaths} from '../Entities';
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

// TODO: это специализированная для solid и master сборок
export interface EntitySet {
  srcDir: string;
  manifest: ManifestBase;
  // relative path to main file
  main?: string;
  // relative paths to entity files
  files: string[];
}

// entities set by type and name like {driver: {Name: {...EntitySet}}}
export interface EntitiesSet {
  devices: {[index: string]: EntitySet};
  drivers: {[index: string]: EntitySet};
  services: {[index: string]: EntitySet}

  // // js manifests of entities
  // entitiesManifests: AllManifests;
  // // paths to main files of entities
  // entitiesMains: FilesPaths;
  // // original files of entities like {devices: {deviceId: [...files]}, drivers, services}
  // //srcEntitiesFiles: FilesPaths;
  // // files of entities in storage like {devices: {deviceId: [...files]}, drivers, services}
  // entitiesFiles: FilesPaths;
}


export default interface HostFilesSet extends DefinitionsSet {
  // TODO: review
  config?: HostConfig;
  entities: EntitiesSet;
}
