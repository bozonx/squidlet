// parsed manifest of device
import SchemaElement from './SchemaElement';


export default interface ManifestBase {
  // unique name. Usually it is ClassName of main class
  name: string;
  // relative path to main file
  main: string;
  props?: {[index: string]: SchemaElement};
  // dir where manifest and other entity files are placed.
  // It uses in development environment to load source ts files.
  srcDir?: string;
  // custom values of manifest
  [index: string]: any;
}
