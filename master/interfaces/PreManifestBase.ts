// parsed manifest of device
export default interface PreManifestBase {
  // TODO: зачем ????
  // directory where manifest places. It is set on master configure time
  baseDir: string;
  // unique name. Usually it is ClassName of main class
  name: string;
  // path to device main file
  main: string;

  // drivers dependencies - list of drivers names which is used
  drivers?: string[];
  // properties of instance
  props?: {[index: string]: any};
  // additional files
  files?: string[];
}
