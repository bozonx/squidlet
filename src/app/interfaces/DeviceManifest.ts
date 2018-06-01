export default interface DeviceManifest {
  // directory where manifest places. It is set on master configure time
  baseDir: string;
  // name of device e.g. "BinarySensor"
  name: string;
  // path to device main file
  device: string;
  // path to device's schema definition in yaml format
  schema: string;
}
