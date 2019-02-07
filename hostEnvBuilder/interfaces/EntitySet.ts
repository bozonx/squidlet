import DeviceManifest from '../../host/interfaces/DeviceManifest';
import DriverManifest from '../../host/interfaces/DriverManifest';
import ServiceManifest from '../../host/interfaces/ServiceManifest';


// // entities set by type and name like {driver: {Name: {...EntitySet}}}
// export interface EntitiesSet {
//   devices: {[index: string]: EntitySet};
//   drivers: {[index: string]: EntitySet};
//   services: {[index: string]: EntitySet};
// }



export interface SrcEntitySet {
  srcDir: string;

  manifest: DeviceManifest | DriverManifest | ServiceManifest;
  // relative path to main file
  main?: string;
  // relative paths to entity files
  files: string[];
}

export default interface SrcEntitiesSet {
  devices: {[index: string]: SrcEntitySet};
  drivers: {[index: string]: SrcEntitySet};
  services: {[index: string]: SrcEntitySet};
}
