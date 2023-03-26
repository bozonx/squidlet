import * as path from 'path';

import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/systemConfig.js';
import {EntityType, EntityTypePlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import Logger from '../../../../squidlet-networking/src/interfaces/Logger';
import buildEntity from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/buildEntity.js';
import UsedEntities, {EntitiesNames} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/UsedEntities.js';
import HostEntitySet from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostEntitySet.js';
import {convertEntityTypeToPlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import {convertEntityTypePluralToSingle} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/helpers.js';
import {OwnerOptions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/interfaces/OnwerOptions.js';


/**
 * Write all the host's entities files to storage.
 */
export default class EntitiesWriter {
  private readonly usedEntities: UsedEntities;
  private readonly buildDir: string;
  private readonly tmpBuildDir: string;
  private readonly os: Os;
  private readonly ownerOptions?: OwnerOptions;
  private readonly log: Logger;
  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.buildDir, systemConfig.hostSysCfg.envSetDirs.entities);
  }


  constructor(
    os: Os,
    log: Logger,
    usedEntities: UsedEntities,
    buildDir: string,
    tmpBuildDir: string,
    ownerOptions?: OwnerOptions
  ) {
    this.os = os;
    this.log = log;
    this.usedEntities = usedEntities;
    this.buildDir = buildDir;
    this.tmpBuildDir = tmpBuildDir;
    this.ownerOptions = ownerOptions;
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
      const pluralType = typeName as EntityTypePlural;
      const entityType = convertEntityTypePluralToSingle(pluralType);

      for (let entityName of usedEntities[pluralType]) {
        await this.proceedEntity(entityType, entityName);
      }
    }
  }

  private async proceedEntity(entityType: EntityType, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, convertEntityTypeToPlural(entityType), entityName);
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet(entityType, entityName);

    // write manifest
    await this.os.writeJson(
      path.join(entityDstDir, systemConfig.hostSysCfg.fileNames.manifest),
      entitySet.manifest,
      this.ownerOptions
    );

    // build and write main file if exists
    await this.buildMainFile(entityType, entityName);

    // copy assets
    for (let relativeFileName of entitySet.files) {
      const fromFile = path.resolve(entitySet.srcDir, relativeFileName);
      const toFileName = path.resolve(entityDstDir, relativeFileName);

      // make inner dirs
      await this.os.mkdirP(path.dirname(toFileName), this.ownerOptions);

      // copy
      await this.os.copyFile(fromFile, toFileName, this.ownerOptions);
    }
  }

  private async buildMainFile(entityType: EntityType, entityName: string) {
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet(entityType, entityName);
    const entityDstDir: string = path.join(this.entitiesDstDir, convertEntityTypeToPlural(entityType), entityName);

    this.log.info(`- building main file of entity "${entityName}"`);
    await this.buildEntity(entityType, entityName, entitySet.srcDir, entityDstDir);
  }

  private async buildEntity(
    entityType: EntityType,
    entityName: string,
    srcDir: string,
    entityDstDir: string
  ) {
    if (!this.tmpBuildDir) {
      throw new Error(`Temporary build dir wasn't specified`);
    }

    return buildEntity(entityType, entityName, this.tmpBuildDir, srcDir, entityDstDir);
  }

}
