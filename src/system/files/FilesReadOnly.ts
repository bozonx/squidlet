import {System} from '../System.js'


// TODO: запретить в начале пути ..
// TODO: поидее должно быть только чтение, записываеться только при установке и обновлении

export class FilesReadOnly {
  readonly rootDir: string

  private readonly system: System


  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = rootDir
  }


  async readTextFile(filePath: string): Promise<string> {
    return ''
  }

  async exists(pathTo: string): Promise<boolean> {
    return true
  }

}
