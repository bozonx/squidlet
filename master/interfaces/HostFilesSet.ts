import HostConfig from '../../host/src/app/interfaces/HostConfig';
import DeviceManifest from '../../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../../host/src/app/interfaces/ServiceManifest';
import DeviceDefinition from '../../host/src/app/interfaces/DeviceDefinition';
import DriverDefinition from '../../host/src/app/interfaces/DriverDefinition';
import ServiceDefinition from '../../host/src/app/interfaces/ServiceDefinition';


export default interface HostFilesSet {
  config: HostConfig;

  devicesManifests: DeviceManifest[];
  driversManifests: DriverManifest[];
  servicesManifests: ServiceManifest[];

  // files by entity name
  driversFiles: {[index: string]: string[]};
  devicesFiles: {[index: string]: string[]};
  servicesFiles: {[index: string]: string[]};

  systemDrivers: string[];
  regularDrivers: string[];
  systemServices: string[];
  regularServices: string[];

  devicesDefinitions: DeviceDefinition[];
  // by driver name
  driversDefinitions: {[index: string]: DriverDefinition};
  // by service id
  servicesDefinitions: {[index: string]: ServiceDefinition};
}
