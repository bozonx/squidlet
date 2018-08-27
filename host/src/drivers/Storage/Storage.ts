import Drivers from '../../app/Drivers';
import FsDev, {Stats} from '../../app/interfaces/dev/Fs.dev';


export class Storage {
  //protected readonly drivers: Drivers;
  //protected readonly driverConfig: {[index: string]: any};
  private fsDev: FsDev;


  constructor(drivers: Drivers) {
    this.fsDev = drivers.getDev<FsDev>('Fs');
  }

  /**
   * Make dir even parent dir doesn't exist
   */
  mkDirP(pathToDir: string) {
    // TODO: !!!!
  }

  isDir(pathToDir: string) {
    // TODO: !!!!
  }

  isFile(pathToFile: string) {
    // TODO: !!!!
  }

  isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.fsDev.exists(pathToFileOrDir);
  }

  readFile(pathToFile: string): Promise<string> {
    return this.fsDev.readFile(pathToFile);
  }

  /**
   * Read files and dirs of dir
   */
  readDir(pathToDir: string): Promise<string[]> {
    return this.fsDev.readdir(pathToDir);
  }

  /**
   * Read the only files of dir
   */
  readDirFiles(pathToDir: string) {
    // TODO: !!!!
  }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.fsDev.writeFile(pathToFile, data);
  }

  cp() {
    // TODO: !!!!
  }

  mv() {
    // TODO: !!!!
  }

  rename() {
    // TODO: !!!!
  }

  /**
   * Remove only a file of an empty dir
   */
  rm(pathToFileOrDir: string) {
    // TODO: !!!!
  }

  /**
   * Remove dir recursively or file.
   */
  rmRf(pathToFileOrDir: string) {
    // TODO: !!!!
  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.fsDev.appendFile(pathToFile, data);
  }

  stat(pathToFileOrDir: string): Promise<Stats> {
    return this.fsDev.stat(pathToFileOrDir);
  }

}
