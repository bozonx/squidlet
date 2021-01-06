import HostConfig from '../../system/interfaces/HostConfig';
import EntityDefinition from '../../../src/interfaces/EntityDefinition';
import {IoDefinitions} from '../../system/interfaces/IoItem';


export default interface HostConfigSet {
  // host config
  config: HostConfig;
  // list of drivers
  driversList: string[];
  // list of services
  servicesList: string[];
  // list of devices definitions
  devicesDefinitions: EntityDefinition[];
  // list of drivers definitions
  driversDefinitions: {[index: string]: EntityDefinition};
  // list of services definitions
  servicesDefinitions: {[index: string]: EntityDefinition};
  // list of services definitions
  iosDefinitions: IoDefinitions;
}
