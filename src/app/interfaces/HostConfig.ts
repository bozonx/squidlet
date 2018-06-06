import DeviceManifest from "./DeviceManifest";
import DeviceConf from "./DeviceConf";
import Destination from "../../messenger/interfaces/Destination";


export default interface HostConfig {
  // specific config for each host
  host: {[index: string]: any};
  // TODO: review
  address: Destination;
  // parsed devices manifests by device's class name
  devicesManifests: {[index: string]: DeviceManifest};
  // config of devices by deviceId
  devicesConfigs: {[index: string]: DeviceConf};
  // paths to files of drivers on local storage
  drivers: Array<string>;
  // addresses of the nearest neighbors hosts
  neighbors: {[index: string]: Destination};
  // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  routes: {[index: string]: Array<string>};
  // TODO: сделать линки и координаторы
  links: object;
}
