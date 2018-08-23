// parsed manifest of device
export default interface ManifestBase {
  // unique name
  name: string;
  // path to device main file
  main: string;
  // properties of instance
  //props?: {[index: string]: any};
}
