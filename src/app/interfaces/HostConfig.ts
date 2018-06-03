import DeviceManifest from "./DeviceManifest";
import DeviceConf from "./DeviceConf";
import Destination from "./Destination";


export default interface HostConfig {
  // TODO: не нужно
  slave?: boolean;
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
  // TODO: продумать структуру
  // routes for coordinators and links
  routes: {[index: string]: Array<string>}
}
