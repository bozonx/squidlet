

// TODO: instead of delete move to trash if not force
// TODO: versione all exclude - _Apps, .trash, _Downdloads, _Tmp, _Mnt
// TODO: ходить по симлинкам как по маунту в _Mnt


import {DriversManager} from '../../system/managers/DriversManager.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {FilesWrapper} from './FilesWrapper.js'

export class FilesHome extends FilesWrapper {
  // // it is relative path of system root dir
  // readonly rootDir: string
  // private readonly filesDriver: FilesDriver
  //
  // constructor(filesDriver: FilesDriver, rootDir: string) {
  //   this.filesDriver = filesDriver
  //   // TODO: а зачем оно убиралось???
  //   //this.rootDir = clearRelPathLeft(rootDir)
  //   this.rootDir = rootDir
  // }

}