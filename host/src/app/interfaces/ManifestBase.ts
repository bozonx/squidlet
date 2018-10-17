// parsed manifest of device
export default interface ManifestBase {
  // unique name. Usually it is ClassName of main class
  name: string;
  // TODO: может сделать пустым объектом ???
  // default properties of instance - can be an object or a path to props yal file
  props?: {[index: string]: any} | string;
  // TODO: может сделать пустым массивом ???
  // drivers and devs dependencies - list of drivers names which is used
  drivers?: string[];

  // custom values of manifest
  [index: string]: any;
}
