/**
 * It uses the next file structure:
 *
 *     configs/
 *       config.json
 *       devicesDefinitions.json
 *       ... other configs
 *     entities/
 *       devices/
 *         deviceName/
 *           manifest.json
 *           __main.js
 *           customFile.json
 *           ...other entity's files
 *       driver/
 *       services/
 *     host/
 *       app/
 *       ... other host's files
 *       index.js
 *     entities-hashes.json
 *     configs-hashes.json
 *     host-hashes.json
 */

import SysDev from '../../app/interfaces/dev/Sys';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import pathJoin from '../../helpers/nodeLike';
import {ManifestsTypePluralName} from '../../app/interfaces/ManifestTypes';
import {EntityClassType} from '../../app/entities/EntityManagerBase';


// TODO: to initialization config ???
const HOST_HASHES_FILE = 'host-hashes.json';
const CONFIGS_HASHES_FILE = 'configs-hashes.json';
const ENTITIES_HASHES_FILE = 'entities-hashes.json';
export const HOST_DIR = 'host';
export const CONFIGS_DIR = 'configs';
export const ENTITIES_DIR = 'entities';


export class SysDriver extends DriverBase {

  private get sysDev(): SysDev {
    return this.depsInstances.sysDev as SysDev;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.sysDev = await getDriverDep('Sys.dev')
      .getInstance(this.props);
  }


  getHostHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(HOST_HASHES_FILE);
  }

  getConfigsHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(CONFIGS_HASHES_FILE);
  }

  getEntitiesHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(ENTITIES_HASHES_FILE);
  }

  loadConfig(configName: string): Promise<{[index: string]: any}> {

    // TODO: запретить выход наверх

    return this.sysDev.readJsonObjectFile(pathJoin(CONFIGS_DIR, `${configName}.json`));
  }

  async loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType> {

    // TODO: запретить выход наверх

    const fileName = this.env.system.initCfg.fileNames.mainJs;

    return this.sysDev.requireFile(pathJoin(ENTITIES_DIR, pluralType, entityName, fileName));
  }

  async loadEntityManifest(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<{[index: string]: any}> {
    await this.checkEntity(pluralType, entityName);

    const pathToFile = pathJoin(ENTITIES_DIR, entityName, this.env.system.initCfg.fileNames.manifest);

    return this.sysDev.readJsonObjectFile(pathToFile);
  }

  async loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    await this.checkEntity(pluralType, entityName, fileName);

    return this.sysDev.readStringFile(pathJoin(ENTITIES_DIR, entityName, fileName));
  }

  async loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    await this.checkEntity(pluralType, entityName, fileName);

    return this.sysDev.readBinFile(pathJoin(ENTITIES_DIR, entityName, fileName));
  }

  async writeHostFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeConfigFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeEntityFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  writeHostHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(HOST_HASHES_FILE, content);
  }

  writeConfigHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(CONFIGS_HASHES_FILE, content);
  }

  writeEntitiesHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(ENTITIES_HASHES_FILE, content);
  }

  async removeHostFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }

  async removeEntitesFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }


  private async checkEntity(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName?: string
  ) {

    // TODO: запротить выход наверх, проверить существование entityName

  }

}
