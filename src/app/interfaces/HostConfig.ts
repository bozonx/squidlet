import DeviceManifest from "./DeviceManifest";
import DeviceConf from "./DeviceConf";
import Destination from "./Destination";


interface Route {
  type: string;
  // list of host ids from current host to destination host
  route: Array<string>
}

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
  // routes for coordinators and links - { configuratorHostId: { type: 'configurator', route: [ ... ] } }
  routes: {[index: string]: Route};
}
