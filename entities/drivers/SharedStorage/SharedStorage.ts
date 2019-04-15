import StorageDev, {Stats} from 'system/interfaces/dev/StorageDev';
import DriverBase from 'system/baseDrivers/DriverBase';
import {pathDirname, pathJoin} from 'system/helpers/nodeLike';
import systemConfig from 'system/config/systemConfig';


/**
 * Shared variable data storage
 */
export class SharedStorage extends DriverBase {
  private rootDir: string = '';
  private get storageDev(): StorageDev {
    return this.depsInstances.storageDev as StorageDev;
  }


  protected willInit = async () => {
    this.depsInstances.storageDev = this.env.getDev('Storage');
    this.rootDir = pathJoin(
      this.env.config.config.varDataDir,
      systemConfig.storageDirs.common,
    );
  }


  async isDir(pathToDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);
    const stats: Stats = await this.storageDev.stat(absPath);

    return stats.dir;
  }

  async isFile(pathToFile: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFile);
    const stats: Stats = await this.storageDev.stat(absPath);

    return !stats.dir;
  }

  isExists(pathToFileOrDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageDev.exists(absPath);
  }

  readFile(pathToFile: string): Promise<string> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageDev.readFile(absPath);
  }

  readBinFile(pathToFile: string): Promise<Uint8Array> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageDev.readBinFile(absPath);
  }

  /**
   * Read files and dirs of dir
   */
  readDir(pathToDir: string): Promise<string[]> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);

    return this.storageDev.readdir(absPath);
  }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageDev.writeFile(absPath, data);
  }

  /**
   * Remove only a file of an empty dir
   */
  async rm(pathToFileOrDir: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const stats: Stats = await this.storageDev.stat(pathToFileOrDir);

    if (stats.dir) {
      return this.storageDev.rmdir(absPath);
    }
    else {
      return this.storageDev.unlink(absPath);
    }
  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageDev.appendFile(absPath, data);
  }

  stat(pathToFileOrDir: string): Promise<Stats> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageDev.stat(absPath);
  }


  async cp(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support copying dir recursively
  }

  async mv(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!! support moving dir recursively

    const oldAbsPath: string = pathJoin(this.rootDir, fromPath);
    const newAbsPath: string = pathJoin(this.rootDir, toPath);

    return this.storageDev.rename(oldAbsPath, newAbsPath);
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const fileDir: string = pathDirname(absPath);
    const newPath: string = pathJoin(fileDir, newName);

    return this.storageDev.rename(absPath, newPath);
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


  // async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
  //   const filePath = path.join(__storageDir, fileName);
  //   const fileContent: string = await callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});
  //
  //   return JSON.parse(fileContent);
  // }
  //
  // readStringFile(fileName: string): Promise<string> {
  //   const filePath = path.join(__storageDir, fileName);
  //
  //   return callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});
  // }

  // async readBinFile(fileName: string): Promise<Uint8Array> {
  //   const buffer: Buffer = await callPromised(fs.readFile, path.join(__storageDir, fileName));
  //
  //   return convertBufferToUint8Array(buffer);
  // }

  // async requireFile(fileName: string): Promise<any> {
  //   return require(path.join(__storageDir, fileName));
  // }

}
