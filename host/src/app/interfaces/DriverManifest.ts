// parsed manifest of device
import ManifestBase from './ManifestBase';


export type DriverType = 'system' | 'dev';

export default interface DriverManifest extends ManifestBase {
  // type of driver: system, dev. If type isn't defined it means a regular driver.
  type?: DriverType;
}
