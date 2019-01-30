import ManifestBase from './ManifestBase';


export default interface ServiceManifest extends ManifestBase {
  // is it system service or regular
  system?: boolean;
}
