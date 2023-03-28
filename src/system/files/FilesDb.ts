import {clearRelPathLeft} from 'squidlet-lib'
import {System} from '../System.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class FilesDb {
  readonly rootDir: string

  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = clearRelPathLeft(rootDir)
  }


}
