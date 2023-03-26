import StorageIo, {StatsSimplified} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import {pathDirname, pathJoin} from '../squidlet-lib/src/paths';
import systemConfig from '__old/system/systemConfig';
import ServiceBase from 'src/base/ServiceBase';


interface Props {
}


/**
 * Shared variable data storage. It manages data in varData/common
 */
export default class SharedStorage extends ServiceBase<Props> {
  private rootDir!: string;
  private storageIo!: StorageIo;


  init = async () => {
    this.storageIo = this.context.getIo('Storage');
    this.rootDir = pathJoin(
      systemConfig.rootDirs.varData,
      systemConfig.storageDirs.var,
    );
  }


  async isDir(pathToDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);
    const stats: StatsSimplified = await this.storageIo.stat(absPath);

    return stats.dir;
  }

  async isFile(pathToFile: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFile);
    const stats: StatsSimplified = await this.storageIo.stat(absPath);

    return !stats.dir;
  }

  isExists(pathToFileOrDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageIo.exists(absPath);
  }

  readFile(pathToFile: string): Promise<string> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.readFile(absPath);
  }

  readBinFile(pathToFile: string): Promise<Uint8Array> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.readBinFile(absPath);
  }

  /**
   * Read files and dirs of dir
   */
  readDir(pathToDir: string): Promise<string[]> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);

    return this.storageIo.readdir(absPath);
  }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.writeFile(absPath, data);
  }

  /**
   * Remove only a file of an empty dir
   */
  async rm(pathToFileOrDir: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const stats: StatsSimplified = await this.storageIo.stat(pathToFileOrDir);

    if (stats.dir) {
      return this.storageIo.rmdir(absPath);
    }
    else {
      return this.storageIo.unlink(absPath);
    }
  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.appendFile(absPath, data);
  }

  stat(pathToFileOrDir: string): Promise<StatsSimplified> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageIo.stat(absPath);
  }


  async cp(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support copying dir recursively
  }

  async mv(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!! support moving dir recursively

    const oldAbsPath: string = pathJoin(this.rootDir, fromPath);
    const newAbsPath: string = pathJoin(this.rootDir, toPath);

    return this.storageIo.rename(oldAbsPath, newAbsPath);
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const fileDir: string = pathDirname(absPath);
    const newPath: string = pathJoin(fileDir, newName);

    return this.storageIo.rename(absPath, newPath);
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
