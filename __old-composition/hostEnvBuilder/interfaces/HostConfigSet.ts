import HostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostConfig.js';
import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import {IoDefinitions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';


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
