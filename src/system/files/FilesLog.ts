import {System} from '../System.js'


// TODO: поддержка ротации
export class FilesLog {
  readonly accessToken: string
  readonly rootDir: string

  private readonly system: System

  constructor(system: System, accessToken: string, rootDir: string) {
    this.system = system
    this.accessToken = accessToken
    this.rootDir = rootDir
  }
}
