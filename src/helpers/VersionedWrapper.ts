import { pathJoin, pathBasename, pathDirname} from 'squidlet-lib'
import type {StatsSimplified} from '../types/io/FilesIoType.js'
import {FilesDriver} from '../drivers/FilesDriver/FilesDriver.js'
import {DriversManager} from '../system/managers/DriversManager.js'
import {FilesWrapper} from './wrappers/FilesWrapper.js'
import type {FilesDriverType} from '../types/FilesDriverType.js'


export class VersionedWrapper {
  private readonly files: FilesDriverType


  constructor(files: FilesDriverType) {
    this.files = files
  }


  // async appendFile(pathTo: string, data: string | Uint8Array) {
  //   const fullPath = pathJoin(this.rootDir, pathTo)
  //
  //   await this.system.versions.incrementFileVersion(fullPath)
  //
  //   return this.driver.appendFile(fullPath, data)
  // }
  //
  // async mkdir(pathTo: string) {
  //   return this.driver.mkdir(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async readDir(pathTo: string): Promise<string[]> {
  //   return this.driver.readDir(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async readTextFile(pathTo: string): Promise<string> {
  //   return this.driver.readTextFile(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async readBinFile(pathTo: string): Promise<Uint8Array> {
  //   return this.driver.readBinFile(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async readlink(pathTo: string): Promise<string> {
  //   return this.driver.readlink(pathJoin(this.rootDir, pathTo))
  // }
  //
  // // remove an empty dir. Doesn't need to remove versions
  // async rmdir(pathTo: string) {
  //   return this.driver.rmdir(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async unlink(pathTo: string) {
  //   const fullPath = pathJoin(this.rootDir, pathTo)
  //
  //   await this.system.versions.removeFileVersions(fullPath)
  //
  //   return this.driver.unlink(fullPath)
  // }
  //
  // async writeFile(pathTo: string, data: string | Uint8Array) {
  //   const fullPath = pathJoin(this.rootDir, pathTo)
  //
  //   await this.system.versions.incrementFileVersion(fullPath)
  //
  //   return this.driver.writeFile(fullPath, data)
  // }
  //
  // async stat(pathTo: string): Promise<StatsSimplified> {
  //   return this.driver.stat(pathJoin(this.rootDir, pathTo))
  // }
  //
  // async copyFiles(files: [string, string][]) {
  //   return this.driver.copyFiles(files.map(([src, dest]) => {
  //     return [
  //       pathJoin(this.rootDir, src),
  //       pathJoin(this.rootDir, dest)
  //     ]
  //   }))
  // }
  //
  // async renameFiles(files: [string, string][]) {
  //   const fullFilesPaths: [string, string][] = files.map(([src, dest]) => {
  //     return [
  //       pathJoin(this.rootDir, src),
  //       pathJoin(this.rootDir, dest)
  //     ]
  //   })
  //
  //   await this.system.versions.renameVersions(fullFilesPaths)
  //
  //   return this.driver.copyFiles(fullFilesPaths)
  // }
  //
  // // Remove one file or an empty dir
  // async rm(pathToFileOrDir: string) {
  //   const fullPath = pathJoin(this.rootDir, pathToFileOrDir)
  //
  //   if (await this.driver.isFile(fullPath)) {
  //     await this.system.versions.removeFileVersions(fullPath)
  //   }
  //
  //   return this.driver.rm(pathJoin(this.rootDir, pathToFileOrDir))
  // }
  //
  // async rmRf(pathToFileOrDir: string): Promise<void> {
  //   const fullPath = pathJoin(this.rootDir, pathToFileOrDir)
  //
  //   if (await this.driver.isDir(fullPath)) {
  //     await this.system.versions.removeVersionsDirRecursively(fullPath)
  //   }
  //   else {
  //     await this.system.versions.removeFileVersions(fullPath)
  //   }
  //
  //   return this.driver.rmRf(fullPath)
  // }
  //
  // async cp(src: string | string[], destDir: string): Promise<void> {
  //   const fixedSrc = (typeof src === 'string')
  //     ? pathJoin(this.rootDir, src)
  //     : src.map((el) => pathJoin(this.rootDir, el))
  //
  //   return this.driver.cp(fixedSrc, pathJoin(this.rootDir, destDir))
  // }
  //
  // async mv(src: string | string[], destDir: string): Promise<void> {
  //   const srcArr = (typeof src === 'string') ? [src] : src
  //   const fixedSrc = srcArr.map((el) => pathJoin(this.rootDir, el))
  //   const fullFilesPaths: [string, string][] = srcArr.map((el) => {
  //     return [
  //       pathJoin(this.rootDir, el),
  //       pathJoin(this.rootDir, destDir, pathBasename(el))
  //     ]
  //   })
  //
  //   await this.system.versions.renameVersions(fullFilesPaths)
  //
  //   return this.driver.mv(fixedSrc, pathJoin(this.rootDir, destDir))
  // }
  //
  // async rename(pathToFileOrDir: string, newName: string): Promise<void> {
  //   const fullPath = pathJoin(this.rootDir, pathToFileOrDir)
  //
  //   await this.system.versions.renameVersions([[
  //     fullPath,
  //     pathJoin(pathDirname(fullPath), newName)
  //   ]])
  //
  //   return this.driver.rename(fullPath, newName)
  // }
  //
  // async isDir(pathToDir: string): Promise<boolean> {
  //   return this.driver.isDir(pathJoin(this.rootDir, pathToDir))
  // }
  //
  // async isFile(pathToFile: string) {
  //   return this.driver.isFile(pathJoin(this.rootDir, pathToFile))
  // }
  //
  // async isExists(pathToFileOrDir: string): Promise<boolean> {
  //   return this.driver.isExists(pathJoin(this.rootDir, pathToFileOrDir))
  // }
  //
  // async mkDirP(pathToDir: string): Promise<void> {
  //   return this.driver.mkDirP(pathJoin(this.rootDir, pathToDir))
  // }
  //
  // async isFileUtf8(pathTo: string): Promise<boolean> {
  //   return this.driver.isFileUtf8(pathJoin(this.rootDir, pathTo))
  // }

}
