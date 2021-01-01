// parsed manifest of device
export default interface PreManifestBase {
  // directory where manifest places. It is base dir for "main" and "files" params.
  // It sets at build time if manifest is registered as a path to manifest file.
  // You have to set it if you register manifest as an object
  baseDir: string;
  // Unique name of entity in its type. Usually it is ClassName of main class
  name: string;
  // path to device main file relative to manifest place
  main: string;

  // is it system entity or not
  system?: boolean;

  // devices dependencies which entity use
  devices?: string[];
  // drivers dependencies which entity use
  drivers?: string[];
  // services dependencies which entity use
  services?: string[];
  // ios dependencies which entity use
  ios?: string[];

  // additional files relative to manifest place.
  files?: string[];
  // default properties of instance - can be an object or a path to props yal file
  // it can be a string - it points to local yaml file with props
  props?: {[index: string]: any};

  // custom values of manifest
  //[index: string]: any;
}
