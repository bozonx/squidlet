// parsed manifest of device
export default interface ManifestBase {
  // unique name. Usually it is ClassName of main class
  name: string;
  // TODO: может сделать пустым объектом ???
  props?: {[index: string]: any};
  // custom values of manifest
  [index: string]: any;
}
