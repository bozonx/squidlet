import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import {ManifestsTypePluralName} from '../../system/interfaces/ManifestTypes';
import Os from '../../shared/Os';
import Logger from '../interfaces/Logger';
import buildEntity from './buildEntity';
import UsedEntities, {EntitiesNames} from './UsedEntities';
import HostEntitySet from '../interfaces/HostEntitySet';


/**
 * Write all the host's entities files to storage.
 */
export default class EntitiesWriter {
  private readonly usedEntities: UsedEntities;
  private readonly buildDir: string;
  private readonly tmpBuildDir: string;
  private readonly os: Os;
  private readonly log: Logger;
  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.buildDir, systemConfig.hostSysCfg.envSetDirs.entities);
  }


  constructor(os: Os, log: Logger, usedEntities: UsedEntities, buildDir: string, tmpBuildDir: string) {
    this.os = os;
    this.log = log;
    this.usedEntities = usedEntities;
    this.buildDir = buildDir;
    this.tmpBuildDir = tmpBuildDir;
  }


  /**
   * Copy used files of entities to storage
   */
  async writeUsed() {
    if (!this.tmpBuildDir) {
      throw new Error(`Temporary build dir wasn't specified`);
    }

    const usedEntities: EntitiesNames = this.usedEntities.getEntitiesNames();

    // clear tmp dir
    await this.os.rimraf(`${this.tmpBuildDir}/**/*`);

    for (let typeName of Object.keys(usedEntities)) {
      const pluralType = typeName as ManifestsTypePluralName;

      for (let entityName of usedEntities[pluralType]) {
        await this.proceedEntity(pluralType, entityName);
      }
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet(pluralType, entityName);

    // write manifest
    await this.os.writeJson(
      path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.manifest),
      entitySet.manifest
    );

    // build and write main file if exists
    await this.buildMainFile(pluralType, entityName);

    // copy assets
    for (let relativeFileName of entitySet.files) {
      const fromFile = path.resolve(entitySet.srcDir, relativeFileName);
      const toFileName = path.resolve(entityDstDir, relativeFileName);

      // make inner dirs
      await this.os.mkdirP(path.dirname(toFileName));
      // copy
      await this.os.copyFile(fromFile, toFileName);
    }
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, entityName: string) {
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet(pluralType, entityName);
    //const preManifest: PreManifestBase = this.getPreManifest(pluralType, entityName);
    const entityDstDir: string = path.join(this.entitiesDstDir, pluralType, entityName);
    // const mainDstFile = path.join(entityDstDir, path.parse(entitySet.main).name);
    // const renamedMainDstFile = path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.mainJs);

    this.log.info(`- building main file of entity "${entityName}"`);
    await this.buildEntity(pluralType, entityName, entitySet.srcDir, entityDstDir);
    // rename main file
    //await this.os.renameFile(`${mainDstFile}.js`, renamedMainDstFile);
  }

  private async buildEntity(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    srcDir: string,
    entityDstDir: string
  ) {
    if (!this.tmpBuildDir) {
      throw new Error(`Temporary build dir wasn't specified`);
    }

    return buildEntity(pluralType, entityName, this.tmpBuildDir, srcDir, entityDstDir);
  }

}
