export default interface Sys {
  mkdir(fileName: string): Promise<void>;
  readdir(dirName: string): Promise<string[]>;
  readFile(fileName: string): Promise<string>;
  readBinFile(fileName: string): Promise<Uint8Array>;
  requireFile(fileName: string): Promise<any>;
  rmdir(dirName: string): Promise<void>;
  unlink(fileName: string): Promise<void>;
  writeFile(fileName: string, data: string | Uint8Array): Promise<void>;
  exists(fileOrDirName: string): Promise<boolean>;
}
