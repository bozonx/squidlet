import DeviceManifest from '../../host/interfaces/DeviceManifest';
import DriverManifest from '../../host/interfaces/DriverManifest';
import ServiceManifest from '../../host/interfaces/ServiceManifest';


export interface HostEntitiesSet {
  devices: {[index: string]: SrcEntitySet};
  drivers: {[index: string]: SrcEntitySet};
  services: {[index: string]: SrcEntitySet};
}

export default interface SrcEntitySet {
  srcDir: string;
  manifest: DeviceManifest | DriverManifest | ServiceManifest;
  // relative paths to entity files
  files: string[];
  // is it system entity or not
  system: boolean;
}
