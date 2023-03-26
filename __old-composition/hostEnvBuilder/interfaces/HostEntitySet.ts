import DeviceManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/DeviceManifest.js';
import DriverManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/DriverManifest.js';
import ServiceManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/ServiceManifest.js';


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
