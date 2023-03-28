import {System} from '../System.js'


// TODO: файлы сразу сохранять и одновременно держать в памяти несколько секунд
// TODO: если протухание короткое то держать только в памяти
export class FilesCache {
  readonly rootDir: string

  private readonly system: System

  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = rootDir
  }
}
