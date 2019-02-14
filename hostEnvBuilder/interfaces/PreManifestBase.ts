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

  // devices dependencies which entity use
  devices?: string[];
  // drivers dependencies which entity use
  drivers?: string[];
  // devs dependencies which entity use
  devs?: string[];

  // additional files relative to manifest place.
  files?: string[];
  // default properties of instance - can be an object or a path to props yal file
  props?: {[index: string]: any} | string;

  // custom values of manifest
  [index: string]: any;
}
