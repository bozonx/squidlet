import PreManifestBase from './PreManifestBase';


// raw manifest of driver
export default interface PreDriverManifest extends PreManifestBase {
  // generic type of device
  type: string;
}
