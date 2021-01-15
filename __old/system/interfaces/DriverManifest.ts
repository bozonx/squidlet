// TODO: remove

// parsed manifest of device
import EntityManifest from '../../../src/interfaces/EntityManifest';


export default interface DriverManifest extends EntityManifest {
  // is it system driver or regular
  system?: boolean;
}
