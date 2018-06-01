import DeviceManifest from "./DeviceManifest";
import DeviceConf from "./DeviceConf";
import Destination from "./Destination";


export default interface HostConfig {
  slave?: boolean;
  // specific config for each host
  host: {[index: string]: any};
  address: Destination;
  devicesManifests: {[index: string]: DeviceManifest};
  devicesConfigs: {[index: string]: DeviceConf};
  drivers: Array<string>;
}
