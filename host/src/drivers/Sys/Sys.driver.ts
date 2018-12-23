import SysDev from '../../app/interfaces/dev/Sys';
import DriverBase from '../../app/entities/DriverBase';
import EntityDefinition from '../../app/interfaces/EntityDefinition';
import Env from '../../app/interfaces/Env';


export class SysDriver extends DriverBase {
  private syseDev: SysDev;

  constructor(definition: EntityDefinition, env: Env) {
    super(definition, env);

    // TODO: move to onInit()
    // TODO: use dependency
    this.syseDev = this.env.getDev<SysDev>('Storage');
  }

  
  
  isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.syseDev.exists(pathToFileOrDir);
  }

  readFile(pathToFile: string): Promise<string> {
    return this.syseDev.readFile(pathToFile);
  }

  /**
   * Read files and dirs of dir
   */
  readDir(pathToDir: string): Promise<string[]> {
    return this.syseDev.readdir(pathToDir);
  }

  // TODO: add loadJson

  // /**
  //  * Read the only files of dir
  //  */
  // readDirFiles(pathToDir: string) {
  // }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    return this.syseDev.writeFile(pathToFile, data);
  }

  /**
   * Remove only a file of an empty dir
   */
  async rm(pathToFileOrDir: string) {
    // const stats: Stats = await this.syseDev.stat(pathToFileOrDir);
    //
    // if (stats.dir) {
    //   return this.syseDev.rmdir(pathToFileOrDir);
    // }
    // else {
    //   return this.syseDev.unlink(pathToFileOrDir);
    // }
  }

}
