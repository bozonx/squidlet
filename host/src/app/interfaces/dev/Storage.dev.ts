// TODO: сделать appendFile
// TODO: сделать fsstat

export default interface Storage {
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  rmdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  // additional
  copyFile(src: string, dest: string, flags?: number): Promise<void>;
  exists(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
