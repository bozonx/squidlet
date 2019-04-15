import DeviceManifest from '../../system/interfaces/DeviceManifest';
import DriverManifest from '../../system/interfaces/DriverManifest';
import ServiceManifest from '../../system/interfaces/ServiceManifest';


export interface HostEntitiesSet {
  devices: {[index: string]: HostEntitySet};
  drivers: {[index: string]: HostEntitySet};
  services: {[index: string]: HostEntitySet};
}

export default interface HostEntitySet {
  srcDir: string;
  manifest: DeviceManifest | DriverManifest | ServiceManifest;
  // relative paths to entity files
  files: string[];
  // is it system entity or not
  system: boolean;
}
