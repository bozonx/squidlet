import * as path from 'path';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {HOST_TMP_DIR} from '../shared/constants';
import Os from '../shared/Os';
import {getFileNameOfPath} from '../shared/helpers';
import {IOS_GLOBAL_CONST} from './constants';
import Platforms from '../system/interfaces/Platforms';


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
    return `${await this.prepareIoClassesString()}\n${await this.prepareEnvSetString()}\n`;
  }

  private async prepareIoClassesString(): Promise<string> {
    // const platformDir = resolvePlatformDir(this.platform);
    // const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(this.os, platformDir, this.machine);

    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    // TODO: лучше брать только те что реально используются
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;
    let imports = '';
    let exportStr = `\nconst ${IOS_GLOBAL_CONST} = {\n`;

    // make imports
    for (let ioPath of machineIosList) {
      const ioName: string = getFileNameOfPath(ioPath);
      const ioRelPath: string = path.relative(
        this.workDir,
        path.resolve(platformDir, ioPath)
      );

      imports += this.makeImportString(ioName, ioRelPath);
      exportStr += `${ioName},`;
    }

    return imports + exportStr + `};`;
  }

  private async prepareEnvSetString(): Promise<string> {
    return '1111';
  }

  private async rollup() {

  }

  private makeImportString(defaultImportName: string, pathToFile: string): string {
    return `import ${defaultImportName} from '${pathToFile}';\n`;
  }

}
