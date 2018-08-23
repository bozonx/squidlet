import DeviceConf from './DeviceConf';
import DeviceManifest from './DeviceManifest';
import DriverManifest from './DriverManifest';
import ServiceDefinition from './ServiceDefinition';
import ServiceManifest from './ServiceManifest';
// import Destination from '../../messenger/interfaces/Destination';
// import MyAddress from './MyAddress';


export default interface HostConfig {
  // TODO: review
  // specific config for each host
  host: {[index: string]: any};

  // config of devices by deviceId
  devicesConfigs: {[index: string]: DeviceConf};
  // configs of drivers by driver name
  driversConfigs: {[index: string]: DeviceConf};
  // services definitions by service id
  services: {[index: string]: ServiceDefinition};

  devices: {
    defaultStatusRepublishIntervalMs: number,
    defaultConfigRepublishIntervalMs: number,
  };


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
