// TODO: сделать fsstat

export interface Stat {
  // in bytes
  size: number;
  // is it dir or file
  dir: boolean;
  // modified time
  mtime: Date;
}

export default interface Storage {
  appendFile(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  rmdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  stat(path: string): Promise<Stat>;
  // additional
  copyFile(src: string, dest: string, flags?: number): Promise<void>;
  exists(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
