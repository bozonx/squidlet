export interface StatsSimplified {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  symbolicLink: boolean;
  // modified time - number of milliseconds elapsed since 1 January 1970 00:00:00 UTC
  mtime: number;
  // TODO: add
  // atime
  // ctime
  // birthtime
}

export interface FilesIoConfig {
  uid?: number;
  gid?: number;
  // It will be used as root of all the files which are read and written using FilesIo.
  rootDir: string;
}


// export const Methods = [
//   'configure',
//   'appendFile',
//   'mkdir',
//   'readdir',
//   'readFile',
//   'readlink',
//   'readBinFile',
//   'rmdir',
//   'unlink',
//   'writeFile',
//   'stat',
//   'exists',
//   'copyFile',
//   'rename',
// ];


/**
 * FilesIo works with absolute paths like /envSet/..., /varData/... and /tmp/...
 * But actually it joins these paths with workDir and result will be like /workdir/envSet/...
 */
export default interface FilesIoType {
  appendFile(pathTo: string, data: string | Uint8Array): Promise<void>
  mkdir(pathTo: string): Promise<void>
  readdir(pathTo: string): Promise<string[]>
  readTextFile(pathTo: string): Promise<string>

  /**
   * You should pass only symlink. Resolve it by using stat().
   * It returns relative or absolute path to target file
   */
  readlink(pathTo: string): Promise<string>

  readBinFile(pathTo: string): Promise<Uint8Array>
  rmdir(pathTo: string): Promise<void>
  unlink(pathTo: string): Promise<void>
  writeFile(pathTo: string, data: string | Uint8Array): Promise<void>
  stat(pathTo: string): Promise<StatsSimplified>
  // Do it only for simple checks not before read or write
  // because the file can be removed between promises
  exists(pathTo: string): Promise<boolean>
  ////// additional
  copyFile(src: string, dest: string): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  isFileUtf8(pathTo: string): Promise<boolean>

  // TODO: что по части удаления дириктории рекурсивно?
  // TODO: что по части удаления нескольких файлов
  // TODO: чтение файла блоками
}
