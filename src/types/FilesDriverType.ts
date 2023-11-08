import {StatsSimplified} from './io/FilesIoType.js'

export interface FilesDriverType {
  appendFile(pathTo: string, data: string | Uint8Array): Promise<void>
  mkdir(pathTo: string): Promise<void>
  readDir(pathTo: string): Promise<string[]>
  readTextFile(pathTo: string): Promise<string>
  readBinFile(pathTo: string): Promise<Uint8Array>
  readlink(pathTo: string): Promise<string>
  rmdir(pathTo: string): Promise<void>
  unlink(pathTo: string): Promise<void>
  writeFile(pathTo: string, data: string | Uint8Array): Promise<void>
  stat(pathTo: string): Promise<StatsSimplified>
  copyFiles(files: [string, string][]): Promise<void>
  renameFiles(files: [string, string][]): Promise<void>
  rmdirR(pathToDir: string): Promise<void>
  mkDirP(pathToDir: string): Promise<void>
  ////////// ADDITIONAL
  rm(pathToFileOrDir: string): Promise<void>
  cp(src: string | string[], destDir: string): Promise<void>
  mv(src: string | string[], destDir: string): Promise<void>
  rename(pathToFileOrDir: string, newName: string): Promise<void>
  isDir(pathToDir: string): Promise<boolean>
  isFile(pathToFile: string): Promise<boolean>
  isExists(pathToFileOrDir: string): Promise<boolean>
  isFileUtf8(pathTo: string): Promise<boolean>

}
