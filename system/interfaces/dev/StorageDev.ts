export interface Stats {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  symbolicLink: boolean;
  // modified time
  // TODO: какой всетаки формат? - в nodejs mtimeMs - number - 1318289051000.1
  mtime: number;
}

export default interface StorageDev {
  appendFile(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
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
