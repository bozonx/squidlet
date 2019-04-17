import HostConfig from '../../system/interfaces/HostConfig';
import EntityDefinition from '../../system/interfaces/EntityDefinition';
import DevsDefinitions from '../../system/interfaces/DevsDefinitions';


export default interface HostConfigSet {
  // host config
  config: HostConfig;
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
  // list of services definitions
  devsDefinitions: DevsDefinitions;
}
