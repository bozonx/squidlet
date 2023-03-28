import {System} from '../System.js'


export class FilesVersioned {
  readonly rootDir: string

  private readonly system: System


  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = rootDir
  }

}
