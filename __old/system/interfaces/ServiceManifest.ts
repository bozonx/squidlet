import EntityManifest from '../../../src/interfaces/EntityManifest';


export default interface ServiceManifest extends EntityManifest {
  // is it system service or regular
  system?: boolean;
}
