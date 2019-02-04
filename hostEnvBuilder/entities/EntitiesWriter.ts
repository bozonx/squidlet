import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import {EntitiesNames} from './EntitiesCollection';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import ConfigManager from '../ConfigManager';
import EntitiesCollection from './EntitiesCollection';
import Io from '../Io';
import PreManifestBase from '../interfaces/PreManifestBase';


/**
 * Write all the host's entities files to storage.
 */
export default class EntitiesWriter {
  private readonly configManager: ConfigManager;
  private readonly entitiesCollection: EntitiesCollection;
  private readonly io: Io;

  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.configManager.buildDir, systemConfig.entityBuildDir);
  }


  constructor(io: Io, configManager: ConfigManager, entitiesCollection: EntitiesCollection) {
    this.io = io;
    this.configManager = configManager;
    this.entitiesCollection = entitiesCollection;
  }


  /**
   * Copy files of entities to storage
   */
  async write() {
    const allEntities: EntitiesNames = this.entitiesCollection.getAllEntitiesNames();
    
    for (let typeName of Object.keys(allEntities)) {
      const pluralType: ManifestsTypePluralName = typeName as ManifestsTypePluralName;

      for (let entityName of allEntities[pluralType]) {
        await this.proceedEntity(pluralType, entityName);
      }
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    const entitySrcDir = this.entitiesCollection.getSrcDir(pluralType, entityName);

    // write manifest
    await this.io.writeJson(
      path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.manifest),
      this.entitiesCollection.getManifest(pluralType, entityName)
    );

    // TODO: build and write main files if exists
    // TODO: test running of build

    const files: string[] = this.entitiesCollection.getFiles(pluralType, entityName);

    for (let relativeFileName of files) {
      const fromFile = path.resolve(entitySrcDir, relativeFileName);
      const toFileName = path.resolve(entityDstDir, relativeFileName);

      // make inner dirs
      await this.io.mkdirP(path.dirname(toFileName));
      // copy
      await this.io.copyFile(fromFile, toFileName);
    }
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, preManifest: PreManifestBase) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, preManifest.name);
    const mainJsFile = path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.mainJs);

    const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);

    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл
    // TODO: !!!!! поддержка билда js файлов
    // TODO: !!!!! test

  }

}
