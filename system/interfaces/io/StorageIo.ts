export interface Stats {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  symbolicLink: boolean;
  // modified time - number of milliseconds elapsed since 1 January 1970 00:00:00 UTC
  mtime: number;
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


export default interface StorageIo {
  appendFile(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;

  /**
   * You should pass only symlink. Resolve it by using stat().
   * It returns relative or absolute path to target file
   */
  readlink(pathTo: string): Promise<string>;

  readBinFile(path: string): Promise<Uint8Array>;
  rmdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  stat(path: string): Promise<Stats>;
  exists(path: string): Promise<boolean>;
  copyFile(src: string, dest: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
