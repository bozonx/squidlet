// parsed manifest of device
import ManifestBase from '../../../src/interfaces/ManifestBase';


export default interface DriverManifest extends ManifestBase {
  // is it system driver or regular
  system?: boolean;
}
