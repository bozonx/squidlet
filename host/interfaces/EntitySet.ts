import DeviceManifest from './DeviceManifest';
import DriverManifest from './DriverManifest';
import ServiceManifest from './ServiceManifest';


// // entities set by type and name like {driver: {Name: {...EntitySet}}}
// export interface EntitiesSet {
//   devices: {[index: string]: EntitySet};
//   drivers: {[index: string]: EntitySet};
//   services: {[index: string]: EntitySet};
// }

export interface EntitySet {
  manifest: DeviceManifest | DriverManifest | ServiceManifest;
  // relative path to main file
  main?: string;
  // relative paths to entity files
  files: string[];
}

export interface SrcEntitiesSet {
  devices: {[index: string]: SrcEntitySet};
  drivers: {[index: string]: SrcEntitySet};
  services: {[index: string]: SrcEntitySet};
}

export interface SrcEntitySet extends EntitySet {
  srcDir: string;
}
