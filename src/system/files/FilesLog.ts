import {System} from '../System.js'


// TODO: поддержка ротации
export class FilesLog {
  readonly rootDir: string

  private readonly system: System

  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = rootDir
  }
}
