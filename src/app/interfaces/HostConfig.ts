import DeviceManifest from './DeviceManifest';
import DeviceConf from './DeviceConf';
// import Destination from '../../messenger/interfaces/Destination';
// import MyAddress from './MyAddress';


export default interface HostConfig {
  // specific config for each host
  host: {[index: string]: any};

  // parsed devices manifests by device's class name
  devicesManifests: {[index: string]: DeviceManifest};
  // config of devices by deviceId
  devicesConfigs: {[index: string]: DeviceConf};
  // paths to files of drivers on local storage
  drivers: Array<string>;

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
