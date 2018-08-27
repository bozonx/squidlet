// TODO: вместо Buffer использовать Uint8Array
// TODO: может унифицировать options
// TODO: сделать fsstat

export default interface Storage {
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  rmdir(path: string): Promise<void>;
  readFile(path: string): Promise<string | Buffer>;
  copyFile(src: string, dest: string, flags?: number): Promise<void>;
  exists(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Buffer | Uint8Array, options: object | string): Promise<void>;
}
