import DeviceDefinition from './DeviceDefinition';
import ServiceDefinition from './ServiceDefinition';
import DriverDefinition from './DriverDefinition';
import Platforms from '../../master/interfaces/Platforms';


export default interface HostConfig {
  platform: Platforms;

  // specific config for each host
  host: {
    // republish status silently every minute if it hasn't been changed
    defaultStatusRepublishIntervalMs: number;
    // republish config silently every 10 minutes if it hasn't been changed
    defaultConfigRepublishIntervalMs: number;
    // custom params
    params: {[index: string]: any};
  };

  // devices definitions by deviceId
  devices: DeviceDefinition[];
  // drivers definitions by driver name
  drivers: DriverDefinition[];
  // services definitions by service id
  services: ServiceDefinition[];

  // override default params of devices
  devicesDefaults: {[index: string]: any};

  // // TODO: remove
  // address: Destination;
  //
  // connections: Array<MyAddress>;
  // // addresses of the nearest neighbors hosts
  // neighbors: {[index: string]: Destination};
  // // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  // routes: {[index: string]: Array<string>};
  // // TODO: сделать линки и координаторы
  // links: object;
}
