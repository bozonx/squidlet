import {System} from '../System.js'


export class FilesWrapper {
  readonly accessToken: string
  readonly rootDir: string

  private readonly system: System


  constructor(system: System, accessToken: string, rootDir: string) {
    this.system = system
    this.accessToken = accessToken
    this.rootDir = rootDir
  }


  async readTextFile(filePath: string): Promise<string> {
    return ''
  }

  async exists(pathTo: string): Promise<boolean> {
    return true
  }

}
