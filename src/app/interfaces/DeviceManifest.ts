// parsed manifest of device
export default interface DeviceManifest {
  // directory where manifest places. It is set on master configure time
  baseDir: string;
  // name of device e.g. "BinarySensor"
  name: string;
  // path to device main file
  main: string;
  // generic type of device
  type: string;
  // drivers dependencies - list of drivers names which is used in this driver
  drivers?: string[];
  // props of device
  props?: {[index: string]: any};

  // schema of statuses of device
  status?: {[index: string]: any};
  // schema of config of device
  config?: {[index: string]: any};
}
