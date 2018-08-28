import HostConfig from '../../host/src/app/interfaces/HostConfig';
import DeviceManifest from '../../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../../host/src/app/interfaces/ServiceManifest';


export default interface HostFilesSet {
  config: HostConfig;
  devicesManifests: DeviceManifest[];
  driversManifests: DriverManifest[];
  servicesManifests: ServiceManifest[];
  driversFiles: {[index: string]: string[]};
  devicesFiles: {[index: string]: string[]};
  servicesFiles: {[index: string]: string[]};
}
