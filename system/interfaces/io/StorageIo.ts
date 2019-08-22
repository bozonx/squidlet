import IoItem from '../IoItem';


export interface Stats {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  symbolicLink: boolean;
  // modified time - number of milliseconds elapsed since 1 January 1970 00:00:00 UTC
  mtime: number;
}

export interface ConfigParams {
  uid: number;
  gid: number;
}


export const Methods = [
  'appendFile',
  'mkdir',
  'readdir',
  'readFile',
  'readlink',
  'readBinFile',
  'rmdir',
  'unlink',
  'writeFile',
  'stat',
  'exists',
  'copyFile',
  'rename',
];


export default interface StorageIo extends IoItem {
  configure(configParams: ConfigParams): Promise<void>;
  appendFile(pathTo: string, data: string | Uint8Array): Promise<void>;
  mkdir(pathTo: string): Promise<void>;
  readdir(pathTo: string): Promise<string[]>;
  readFile(pathTo: string): Promise<string>;

  /**
   * You should pass only symlink. Resolve it by using stat().
   * It returns relative or absolute path to target file
   */
  readlink(pathTo: string): Promise<string>;

  readBinFile(pathTo: string): Promise<Uint8Array>;
  rmdir(pathTo: string): Promise<void>;
  unlink(pathTo: string): Promise<void>;
  writeFile(pathTo: string, data: string | Uint8Array): Promise<void>;
  stat(pathTo: string): Promise<Stats>;
  exists(pathTo: string): Promise<boolean>;
  copyFile(src: string, dest: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
