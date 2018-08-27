export default interface Storage {
  mkdir(path: string): Promise<void>;
  rmdir(path: string): Promise<void>;

  readFile(path: string, options?: object | string): Promise<any>;
  readdir(path: string, options?: object | string): Promise<string[]>;
  copyFile(src: string, dest: string, flags?: number): Promise<void>;
  exists(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
}
