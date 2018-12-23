import StorageDev, {Stats} from '../../app/interfaces/dev/Storage';
import DriverBase from '../../app/entities/DriverBase';
import EntityDefinition from '../../app/interfaces/EntityDefinition';
import Env from '../../app/interfaces/Env';


export class Storage extends DriverBase {
  private storageDev: StorageDev;

  constructor(definition: EntityDefinition, env: Env) {
    super(definition, env);

    // TODO: move to onInit()
    // TODO: use dependency
    this.storageDev = this.env.getDev<StorageDev>('Storage');
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
