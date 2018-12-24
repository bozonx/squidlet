import SysDev from '../../app/interfaces/dev/Sys';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import pathJoin from '../../helpers/nodeLike';


const HOST_HASHES_FILE = 'host-hashes.json';
const CONFIGS_HASHES_FILE = 'configs-hashes.json';
const ENTITIES_HASHES_FILE = 'entities-hashes.json';
const HOST_DIR = 'host';
const CONFIGS_DIR = 'configs';
const ENTITIES_DIR = 'entities';


export class SysDriver extends DriverBase {

  private get sysDev(): SysDev {
    return this.depsInstances.sysDev as SysDev;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.sysDev = await getDriverDep('Sys.dev')
      .getInstance(this.props);
  }


  getHostHashes(): Promise<string> {
    return this.sysDev.readFile(HOST_HASHES_FILE);
  }

  getConfigsHashes(): Promise<string> {
    return this.sysDev.readFile(CONFIGS_HASHES_FILE);
  }

  getEntitiesHashes(): Promise<string> {
    return this.sysDev.readFile(ENTITIES_HASHES_FILE);
  }

  async loadConfig(configName: string): Promise<{[index: string]: any}> {
    const content: string = await this.sysDev.readFile(pathJoin(CONFIGS_DIR, `${configName}.json`));

    return JSON.parse(content);
  }

  async loadMain(entityName: string, fileName: string): Promise<new (...p: any[]) => void> {
    return this.sysDev.readFile(pathJoin(ENTITIES_DIR, entityName, fileName));
  }

  async loadEntityFile(entityName: string, fileName: string): Promise<string> {
    return this.sysDev.readFile(pathJoin(ENTITIES_DIR, entityName, fileName));
  }

  loadBinEntityFile(entityName: string, fileName: string): Promise<Uint8Array> {
    return this.sysDev.readBinFile(pathJoin(ENTITIES_DIR, entityName, fileName));
  }

  async writeHostFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
  }

  async writeConfigFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
  }

  async writeEntityFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
  }

  writeHostHashesFile(content: string) {
    return this.sysDev.writeFile(HOST_HASHES_FILE, content);
  }

  writeConfigHashesFile(content: string) {
    return this.sysDev.writeFile(CONFIGS_HASHES_FILE, content);
  }

  writeEntitiesHashesFile(content: string) {
    return this.sysDev.writeFile(ENTITIES_HASHES_FILE, content);
  }

  async removeHostFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
  }

  async removeEntitesFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
  }

}
