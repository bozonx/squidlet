// parsed manifest of device
export default interface DeviceManifest {
  // directory where manifest places. It is set on master configure time
  baseDir: string;
  // name of device e.g. "BinarySensor"
  name: string;
  // path to device main file
  device: string;

  // generic type of device
  type: string;

  // props of device
  props?: {[index: string]: any};
  // status of device
  status?: {[index: string]: any};
}
