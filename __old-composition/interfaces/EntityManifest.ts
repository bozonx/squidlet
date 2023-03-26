// parsed manifest of device
import PropElement from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/PropElement.js';


export default interface EntityManifest<Props = Record<string, PropElement>> {
  // TODO: почему не className ??
  // unique name. Usually it is ClassName of main class
  name: string
  // relative path to main file
  main: string
  props?: Props
  // dir where manifest and other entity files are placed.
  // It uses in development environment to load source ts files.
  srcDir?: string
  // is it system's entity
  system?: boolean
  // custom values of manifest
  [index: string]: any
}
