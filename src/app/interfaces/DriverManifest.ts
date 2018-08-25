// parsed manifest of device
import ManifestBase from './ManifestBase';

export default interface DriverManifest extends ManifestBase {
  // type of driver: system, dev. If type isn't defined it means a regular driver.
  type?: string;
}
