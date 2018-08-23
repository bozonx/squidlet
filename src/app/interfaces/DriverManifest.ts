// parsed manifest of device
import ManifestBase from './ManifestBase';

export default interface DriverManifest extends ManifestBase {
  // generic type of device
  type: string;
}
