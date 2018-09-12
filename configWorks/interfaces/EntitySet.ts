import DeviceManifest from '../../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../../host/src/app/interfaces/ServiceManifest';


// entities set by type and name like {driver: {Name: {...EntitySet}}}
export interface EntitiesSet {
  devices: {[index: string]: EntitySet};
  drivers: {[index: string]: EntitySet};
  services: {[index: string]: EntitySet};
}

export default interface EntitySet {
  //srcDir: string;
  manifest: DeviceManifest | DriverManifest | ServiceManifest;
  // relative path to main file
  main?: string;
  // relative paths to entity files
  files: string[];
}
