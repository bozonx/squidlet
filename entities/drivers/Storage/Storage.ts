import StorageDev, {Stats} from 'host/interfaces/dev/StorageDev';
import DriverBase from 'host/baseDrivers/DriverBase';
import {pathJoin} from '../../../host/helpers/nodeLike';
import systemConfig from '../../../host/config/systemConfig';


/**
 * Shared variable data storage
 */
export class Storage extends DriverBase {
  private rootDir: string = '';
  private get storageDev(): StorageDev {
    return this.depsInstances.storageDev as StorageDev;
  }


  protected willInit = async () => {
    this.depsInstances.storageDev = this.env.getDev('Storage');
    this.rootDir = pathJoin(
      this.env.config.config.dataDir,
      systemConfig.storageDirs.common,
    );
  }


  async isDir(pathToDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);
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


  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const filePath = path.join(__storageDir, fileName);
    const fileContent: string = await callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});

    return JSON.parse(fileContent);
  }

  readStringFile(fileName: string): Promise<string> {
    const filePath = path.join(__storageDir, fileName);

    return callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const buffer: Buffer = await callPromised(fs.readFile, path.join(__storageDir, fileName));

    return convertBufferToUint8Array(buffer);
  }

  async requireFile(fileName: string): Promise<any> {
    return require(path.join(__storageDir, fileName));
  }

}
