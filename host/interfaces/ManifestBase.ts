// parsed manifest of device
export default interface ManifestBase {
  // unique name. Usually it is ClassName of main class
  name: string;
  // TODO: может сделать пустым объектом ???
  props?: {[index: string]: any};

  // TODO: поидее в окончательном манифесте это не нужно
  // // devices dependencies which entity use
  // devices?: string[];
  // // drivers dependencies which entity use
  // drivers?: string[];
  // // devs dependencies which entity use
  // devs?: string[];

  // custom values of manifest
  [index: string]: any;
}
