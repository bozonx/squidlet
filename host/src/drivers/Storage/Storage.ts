import DriverEnv from '../../app/DriverEnv';
import FsDev, {Stats} from '../../app/interfaces/dev/Fs.dev';


export class Storage {
  private fsDev: FsDev;

  constructor(drivers: DriverEnv) {
    this.fsDev = drivers.getDev<FsDev>('Fs');
  }

  async isDir(pathToDir: string): Promise<boolean> {
    const stats: Stats = await this.fsDev.stat(pathToDir);

    return stats.dir;
  }

  async isFile(pathToFile: string) {
    const stats: Stats = await this.fsDev.stat(pathToFile);

    return !stats.dir;
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

  // /**
  //  * Read the only files of dir
  //  */
  // readDirFiles(pathToDir: string) {
  // }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.fsDev.writeFile(pathToFile, data);
  }

  /**
   * Remove only a file of an empty dir
   */
  async rm(pathToFileOrDir: string) {
    const stats: Stats = await this.fsDev.stat(pathToFileOrDir);

    if (stats.dir) {
      return this.fsDev.rmdir(pathToFileOrDir);
    }
    else {
      return this.fsDev.unlink(pathToFileOrDir);
    }
  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.fsDev.appendFile(pathToFile, data);
  }

  stat(pathToFileOrDir: string): Promise<Stats> {
    return this.fsDev.stat(pathToFileOrDir);
  }


  async cp(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support dirs
  }

  async mv(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support dirs
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support dirs
  }

  /**
   * Make dir even parent dir doesn't exist
   */
  async mkDirP(pathToDir: string): Promise<void> {
    // TODO: !!!!
  }

  /**
   * Remove dir recursively or file.
   */
  async rmRf(pathToFileOrDir: string): Promise<void> {
    // TODO: !!!!
  }

}
