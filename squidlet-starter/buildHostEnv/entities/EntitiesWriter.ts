import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import {EntitiesNames} from './EntitiesCollection';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import MasterConfig from '../MasterConfig';
import EntitiesCollection from './EntitiesCollection';
import Io from '../Io';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class EntitiesWriter {
  private readonly masterConfig: MasterConfig;
  private readonly entitiesCollection: EntitiesCollection;
  private readonly io: Io;

  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.masterConfig.buildDir, systemConfig.entityBuildDir);
  }


  constructor(io: Io, masterConfig: MasterConfig, entitiesCollection: EntitiesCollection) {
    this.io = io;
    this.masterConfig = masterConfig;
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
    await this.writeJson(
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

  // TODO: may be move to IO
  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.io.mkdirP(path.dirname(fileName));
    await this.io.writeFile(fileName, content);
  }

}
