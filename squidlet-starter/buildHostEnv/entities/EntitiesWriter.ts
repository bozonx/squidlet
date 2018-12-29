import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import {EntitiesNames} from './EntitiesSet';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import MasterConfig from '../MasterConfig';
import EntitiesSet from './EntitiesSet';
import Io from '../Io';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class EntitiesWriter {
  private readonly masterConfig: MasterConfig;
  private readonly entitiesSet: EntitiesSet;
  private readonly io: Io;

  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.masterConfig.buildDir, systemConfig.entityBuildDir);
  }


  constructor(io: Io, masterConfig: MasterConfig, entitiesSet: EntitiesSet) {
    this.io = io;
    this.masterConfig = masterConfig;
    this.entitiesSet = entitiesSet;
  }


  /**
   * Copy files of entities to storage
   */
  async write() {
    const allEntities: EntitiesNames = this.entitiesSet.getAllEntitiesNames();
    
    for (let typeName of Object.keys(allEntities)) {
      const pluralType: ManifestsTypePluralName = typeName as ManifestsTypePluralName;

      for (let entityName of allEntities[pluralType]) {
        await this.proceedEntity(pluralType, entityName);
      }
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    const entitySrcDir = this.entitiesSet.getSrcDir(pluralType, entityName);

    // write manifest
    await this.writeJson(
      path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.manifest),
      this.entitiesSet.getManifest(pluralType, entityName)
    );

    // TODO: build and write main files if exists
    // TODO: test running of build

    const files: string[] = this.entitiesSet.getFiles(pluralType, entityName);

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
