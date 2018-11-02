// parsed manifest of device
export default interface ManifestBase {
  // unique name. Usually it is ClassName of main class
  name: string;
  // TODO: может сделать пустым объектом ???
  props?: {[index: string]: any};
  // TODO: может сделать пустым массивом ???
  // drivers and devs dependencies - list of drivers names which is used
  drivers?: string[];

  // custom values of manifest
  [index: string]: any;
}
