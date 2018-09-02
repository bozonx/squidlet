// parsed manifest of device
export default interface ManifestBase {

  // TODO: поидее name можно убрать ???

  // unique name. Usually it is ClassName of main class
  name: string;
  // default properties of instance - can be an object or a path to props yal file
  props?: {[index: string]: any} | string;
}
