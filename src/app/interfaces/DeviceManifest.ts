export default interface DeviceManifest {
  // directory where manifest places. It is set on master configure time
  baseDir: string;
  // name of device e.g. "BinarySensor"
  name: string;
  // path to device main file
  device: string;

  // generic type of device
  type: string;

  // props of device or path to yaml file with props
  props?: string | {[index: string]: any};
  // status of device or path to yaml file with status
  status?: string | {[index: string]: any};

  // path to device's schema definition in yaml format
  //schema: string;
}
