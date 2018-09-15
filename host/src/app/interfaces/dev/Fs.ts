export interface Stats {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  // modified time
  // TODO: какой всетаки формат? - в nodejs mtimeMs - number - 1318289051000.1
  mtime: number;
}

export default interface Fs {
  appendFile(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  rmdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  stat(path: string): Promise<Stats>;
  exists(path: string): Promise<boolean>;
  // additional
  copyFile(src: string, dest: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
