import HostConfig from '../../host/src/app/interfaces/HostConfig';
import DeviceDefinition from '../../host/src/app/interfaces/DeviceDefinition';
import DriverDefinition from '../../host/src/app/interfaces/DriverDefinition';
import ServiceDefinition from '../../host/src/app/interfaces/ServiceDefinition';


export default interface HostFilesSet {
  config: HostConfig;

  // files of entities like {devices: {deviceId: [...files]}, drivers, services}
  entitiesFiles: {[index: string]: {[index: string]: string[]}};

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
