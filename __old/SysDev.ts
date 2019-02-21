export default interface SysDev {
  mkdir(dirName: string): Promise<void>;
  readdir(dirName: string): Promise<string[]>;
  readJsonObjectFile(fileName: string): Promise<{[index: string]: any}>;
  readStringFile(fileName: string): Promise<string>;
  readBinFile(fileName: string): Promise<Uint8Array>;
  requireFile(fileName: string): Promise<any>;
  rmdir(dirName: string): Promise<void>;
  unlink(fileName: string): Promise<void>;
  writeFile(fileName: string, data: string | Uint8Array): Promise<void>;
  exists(fileOrDirName: string): Promise<boolean>;
}
