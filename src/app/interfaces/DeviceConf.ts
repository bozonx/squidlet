import DeviceManifest from './DeviceManifest';
import DeviceSchema from './DeviceSchema';


export default interface DeviceConf {
  // name of device class e.g. "BinarySensor"
  className: string;
  // uniq id of device like "room.deviceInstanceName"
  deviceId: string;
  // specific config of device
  params: object;
  manifest: DeviceManifest;
  // parsed schema of device
  schema: DeviceSchema;
}
