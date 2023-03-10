// parsed manifest of device
import ManifestBase from './ManifestBase';


export default interface DeviceManifest extends ManifestBase {
  // generic type of device
  type: string;
  // schema of statuses of device
  status?: {[index: string]: any};
  // schema of config of device
  config?: {[index: string]: any};
}
