import DeviceDefinition from './DeviceDefinition';
import DeviceManifest from './DeviceManifest';


// prepared definition of device of host
export default interface DeviceProps extends DeviceDefinition {
  manifest: DeviceManifest;
}
