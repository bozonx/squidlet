import StorageDev, {Stats} from '../../../host/interfaces/dev/Storage';
import DriverBase from '../../../host/baseDrivers/DriverBase';
import {GetDriverDep} from '../../../host/entities/EntityBase';


export class Storage extends DriverBase {
  private get storageDev(): StorageDev {
    return this.depsInstances.storageDev as StorageDev;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    //this.depsInstances.storageDev = await getDriverDep('Storage.dev')
    this.depsInstances.storageDev = this.env.getDev('Storage');
    //  .getInstance(this.props);
  }

  async isDir(pathToDir: string): Promise<boolean> {
    const stats: Stats = await this.storageDev.stat(pathToDir);

    return stats.dir;
  }

  async isFile(pathToFile: string) {
    const stats: Stats = await this.storageDev.stat(pathToFile);

    return !stats.dir;
  }

  isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.storageDev.exists(pathToFileOrDir);
  }

  readFile(pathToFile: string): Promise<string> {
    return this.storageDev.readFile(pathToFile);
  }

  readBinFile(pathToFile: string): Promise<Uint8Array> {
    return this.storageDev.readBinFile(pathToFile);
  }

  /**
   * Read files and dirs of dir
   */
  readDir(pathToDir: string): Promise<string[]> {
    return this.storageDev.readdir(pathToDir);
  }

  // TODO: add loadJson

  // /**
  //  * Read the only files of dir
  //  */
  // readDirFiles(pathToDir: string) {
  // }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.storageDev.writeFile(pathToFile, data);
  }

  /**
   * Remove only a file of an empty dir
   */
  async rm(pathToFileOrDir: string) {
    const stats: Stats = await this.storageDev.stat(pathToFileOrDir);

    if (stats.dir) {
      return this.storageDev.rmdir(pathToFileOrDir);
    }
    else {
      return this.storageDev.unlink(pathToFileOrDir);
    }
  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.storageDev.appendFile(pathToFile, data);
  }

  stat(pathToFileOrDir: string): Promise<Stats> {
    return this.storageDev.stat(pathToFileOrDir);
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
    // TODO: !!!! use helpers/mkdirPLogic.ts
  }

  /**
   * Remove dir recursively or file.
   */
  async rmRf(pathToFileOrDir: string): Promise<void> {
    // TODO: !!!!
  }

}
