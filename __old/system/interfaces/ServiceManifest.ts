import ManifestBase from '../../../src/interfaces/ManifestBase';


export default interface ServiceManifest extends ManifestBase {
  // is it system service or regular
  system?: boolean;
}
