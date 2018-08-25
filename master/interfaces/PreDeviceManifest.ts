import PreManifestBase from './PreManifestBase';


// raw manifest of device
export default interface PreDeviceManifest extends PreManifestBase {
  // generic type of device
  type: string;

  // schema of statuses of device
  status?: {[index: string]: any};
  // schema of config of device
  config?: {[index: string]: any};
}
