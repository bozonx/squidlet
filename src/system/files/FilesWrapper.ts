import {System} from '../System.js'


export class FilesWrapper {
  private readonly system: System

  constructor(system: System) {
    this.system = system
  }


  async readTextFile(filePath: string): Promise<string> {
    return ''
  }

  async exists(pathTo: string): Promise<boolean> {
    return true
  }

}
