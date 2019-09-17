import * as path from 'path';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {HOST_TMP_DIR} from '../shared/constants';
import Os from '../shared/Os';
import {getFileNameOfPath, removeExtFromFileName} from '../shared/helpers';
import {ENV_SET_GLOBAL_CONST, IOS_GLOBAL_CONST, MAIN_FILES_GLOBAL_CONST} from './constants';
import Platforms from '../system/interfaces/Platforms';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../hostEnvBuilder/interfaces/HostEntitySet';


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
    await this.os.mkdirP(this.tmpDir);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const indexFileStr: string = await this.makeIndexFile();
    const indexFilePath = path.join(this.workDir, 'index.ts');

    await this.os.writeFile(indexFilePath, indexFileStr);

    await this.rollup();
  }


  private async makeIndexFile(): Promise<string> {
    return this.prepareIoClassesString()
      + '\n\n'
      + this.prepareEnvSetString()
      + '\n\n'
      + this.prepareMainFilesString()
      + '\n';
  }

  private prepareIoClassesString(): string {
    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    // TODO: лучше брать только те что реально используются
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;
    let imports = '';
    let exportStr = `\nglobal.${IOS_GLOBAL_CONST} = {\n`;

    // make imports
    for (let ioPath of machineIosList) {
      const ioName: string = getFileNameOfPath(ioPath);
      const ioRelPath: string = path.relative(
        this.workDir,
        path.resolve(platformDir, ioPath)
      );

      imports += this.makeImportString(ioName, ioRelPath);
      exportStr += `  ${ioName},\n`;
    }

    return imports + exportStr + `};`;
  }

  private prepareEnvSetString(): string {
    const envSetStr = JSON.stringify(this.envBuilder.generateProdEnvSet(), null,2);

    return `global.${ENV_SET_GLOBAL_CONST} = ${envSetStr}`;
  }

  private prepareMainFilesString(): string {
    const envSet: HostEnvSet = this.envBuilder.generateDevelopEnvSet();
    let imports = '';
    let exportStr = `\nglobal.${MAIN_FILES_GLOBAL_CONST} = {\n`;

    const eachEntity = (entities: {[index: string]: HostEntitySet}) => {
      // TODO: add
    };

    eachEntity(envSet.entities.devices);
    eachEntity(envSet.entities.drivers);
    eachEntity(envSet.entities.services);

    return imports + exportStr + `};`;
  }

  private async rollup() {
    // TODO: add
  }

  private makeImportString(defaultImportName: string, pathToFile: string): string {
    return `import ${defaultImportName} from '${removeExtFromFileName(pathToFile)}';\n`;
  }

}
