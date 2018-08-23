import DeviceManifest from './DeviceManifest';

// TODO: review

export default interface DeviceConf {
  // name of device class e.g. "BinarySensor"
  className: string;
  // uniq id of device like "room.deviceInstanceName"
  deviceId: string;
  // specific props of device instance
  props: {[index: string]: any};
  // parsed manifest of device
  manifest: DeviceManifest;
}
