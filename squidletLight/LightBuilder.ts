import * as path from 'path';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {HOST_TMP_DIR} from '../shared/constants';
import Os from '../shared/Os';
import {getFileNameOfPath, removeExtFromFileName} from '../shared/helpers';
import {ENV_SET_GLOBAL_CONST} from './constants';
import Platforms from '../system/interfaces/Platforms';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../hostEnvBuilder/interfaces/HostEntitySet';
import {EntityTypePlural} from '../system/interfaces/EntityTypes';


export default class LightBuilder {
  private readonly workDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly tmpDir: string;
  private readonly os: Os = new Os();
  private readonly envBuilder: EnvBuilder;


  constructor(workDir: string, platform: Platforms, machine: string, hostConfigPath: string) {
    this.workDir = workDir;
    this.platform = platform;
    this.machine = machine;
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);

    this.envBuilder = new EnvBuilder(
      hostConfigPath,
      this.workDir,
      this.tmpDir,
      this.platform,
      this.machine,
    );
  }


  async build() {
    // TODO: удаляет все вместе с родительской директорией, но лучше чтобы только содержимое
    await this.os.rimraf(this.workDir);
    await this.os.mkdirP(this.tmpDir);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const indexFilePath = path.join(this.workDir, 'index.ts');
    const indexFileStr: string = await this.makeIndexFile();
    const iosFilePath: string = path.join(this.workDir, 'ios.ts');
    const iosFileStr: string = await this.prepareIoClassesString();
    const devicesFilePath: string = path.join(this.workDir, 'devicesMainFiles.ts');
    const devicesFileStr: string = await this.makeEntitiesMainFilesString('devices');
    const driversFilePath: string = path.join(this.workDir, 'driversMainFiles.ts');
    const driversFileStr: string = await this.makeEntitiesMainFilesString('drivers');
    const servicesFilePath: string = path.join(this.workDir, 'servicesMainFiles.ts');
    const servicesFileStr: string = await this.makeEntitiesMainFilesString('services');

    await this.os.writeFile(indexFilePath, indexFileStr);
    await this.os.writeFile(iosFilePath, iosFileStr);
    await this.os.writeFile(devicesFilePath, devicesFileStr);
    await this.os.writeFile(driversFilePath, driversFileStr);
    await this.os.writeFile(servicesFilePath, servicesFileStr);

    await this.rollup();
  }


  private async makeIndexFile(): Promise<string> {
    // TODO: add System starter import
    // TODO: add ioSet import
    return this.prepareEnvSetString()
      + '\n';
  }

  private prepareIoClassesString(): string {
    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    // TODO: лучше брать только те что реально используются
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;
    let exportsStr = '';

    for (let ioPath of machineIosList) {
      const ioName: string = getFileNameOfPath(ioPath);
      const ioRelPath: string = path.relative(
        this.workDir,
        path.resolve(platformDir, ioPath)
      );

      exportsStr += this.makeExportString(ioName, ioRelPath);
    }

    return exportsStr;
  }

  private prepareEnvSetString(): string {
    const envSetStr = JSON.stringify(this.envBuilder.generateProdEnvSet(), null,2);

    return `// @ts-ignore\nglobal.${ENV_SET_GLOBAL_CONST} = ${envSetStr}`;
  }

  private makeEntitiesMainFilesString(pluralName: EntityTypePlural): string {
    const envSet: HostEnvSet = this.envBuilder.generateDevelopEnvSet();
    const entities: {[index: string]: HostEntitySet} = envSet.entities[pluralName];
    let exportsStr = '';

    for (let entityName of Object.keys(entities)) {
      const srcAbsDir: string = entities[entityName].srcDir;
      const fileName = path.join(srcAbsDir, entities[entityName].manifest.main);

      exportsStr += this.makeExportString(entities[entityName].manifest.name, fileName);
    }

    return exportsStr;
  }

  private async rollup() {
    // TODO: add
  }

  private makeExportString(defaultImportName: string, pathToFile: string): string {
    return `export {default as ${defaultImportName}} from '${removeExtFromFileName(pathToFile)}';\n`;
  }

  // private makeImportString(defaultImportName: string, pathToFile: string): string {
  //   return `import ${defaultImportName} from '${removeExtFromFileName(pathToFile)}';\n`;
  // }

}
