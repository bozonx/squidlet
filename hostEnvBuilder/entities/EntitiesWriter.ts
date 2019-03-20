import * as path from 'path';
import * as rimraf from 'rimraf';

import systemConfig from '../configs/systemConfig';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import ConfigManager from '../ConfigManager';
import Io from '../Io';
import Register from './Register';
import Logger from '../interfaces/Logger';
import buildEntity from './buildEntity';
import UsedEntities, {EntitiesNames} from './UsedEntities';
import SrcEntitySet from '../interfaces/SrcEntitiesSet';


/**
 * Write all the host's entities files to storage.
 */
export default class EntitiesWriter {
  private readonly configManager: ConfigManager;
  private readonly usedEntities: UsedEntities;
  private readonly register: Register;
  private readonly io: Io;
  private readonly log: Logger;
  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.configManager.buildDir, systemConfig.hostSysCfg.rootDirs.entities);
  }


  constructor(
    io: Io,
    log: Logger,
    configManager: ConfigManager,
    usedEntities: UsedEntities,
    register: Register,
  ) {
    this.io = io;
    this.log = log;
    this.configManager = configManager;
    this.usedEntities = usedEntities;
    this.register = register;
  }


  /**
   * Copy used files of entities to storage
   */
  async writeUsed() {
    if (!this.configManager.tmpBuildDir) {
      throw new Error(`Temporary build dir wasn't specified`);
    }

    const usedEntities: EntitiesNames = this.usedEntities.getEntitiesNames();

    // clear tmp dir
    rimraf.sync(`${this.configManager.tmpBuildDir}/**/*`);

    for (let typeName of Object.keys(usedEntities)) {
      const pluralType = typeName as ManifestsTypePluralName;

      for (let entityName of usedEntities[pluralType]) {
        await this.proceedEntity(pluralType, entityName);
      }
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet(pluralType, entityName);

    // write manifest
    await this.io.writeJson(
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
      await this.io.mkdirP(path.dirname(toFileName));
      // copy
      await this.io.copyFile(fromFile, toFileName);
    }
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, entityName: string) {
    if (!this.configManager.tmpBuildDir) {
      throw new Error(`Temporary build dir wasn't specified`);
    }

    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet(pluralType, entityName);
    //const preManifest: PreManifestBase = this.getPreManifest(pluralType, entityName);
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    // const mainDstFile = path.join(entityDstDir, path.parse(entitySet.main).name);
    // const renamedMainDstFile = path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.mainJs);

    this.log.info(`- building main file of entity "${entityName}"`);
    await buildEntity(pluralType, entityName, this.configManager.tmpBuildDir, entitySet.srcDir, entityDstDir);
    // rename main file
    //await this.io.renameFile(`${mainDstFile}.js`, renamedMainDstFile);
  }

  // private getPreManifest(pluralType: ManifestsTypePluralName, entityName: string): PreManifestBase {
  //   if (pluralType === 'devices') {
  //     return this.register.getDevicesPreManifests()[entityName];
  //   }
  //   else if (pluralType === 'drivers') {
  //     return this.register.getDriversPreManifests()[entityName];
  //   }
  //   // services
  //   return this.register.getServicesPreManifests()[entityName];
  // }

}
