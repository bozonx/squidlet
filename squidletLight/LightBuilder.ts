import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import * as path from "path";
import {HOST_ENVSET_DIR} from '../shared/constants';
import Os from '../shared/Os';
import {getFileNameOfPath, loadMachineConfigInPlatformDir, resolvePlatformDir} from '../shared/helpers';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import {IOS_GLOBAL_CONST} from './constants';

export default class LightBuilder {
  private readonly os: Os = new Os();
  private readonly envBuilder: EnvBuilder;


  constructor() {
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);

    this.envBuilder = new EnvBuilder(
      // this.props.hostConfig,
      // this.props.envSetDir,
      // tmpDir,
      // this.props.platform,
      // this.props.machine,
    );
  }


  async build() {
    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    // await this.os.mkdirP(this.props.varDataDir, { uid: this.props.uid, gid: this.props.gid });
  }


  private makeIndexFile(): string {
    return `${this.prepareIoClassesString()}\n${this.prepareEnvSetString()}\n`;
  }

  private async prepareIoClassesString(): Promise<string> {
    // const platformDir = resolvePlatformDir(this.platform);
    // const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(this.os, platformDir, this.machine);

    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    // TODO: лучше брать только те что реально используются
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;
    let imports = '';
    let exportStr = `const ${IOS_GLOBAL_CONST} = {\n`;

    // make imports
    for (let ioPath of machineIosList) {
      const ioName: string = getFileNameOfPath(ioPath);

      imports += this.makeImportString(ioName, path.resolve(platformDir, ioPath));
      exportStr += `${ioName},`;
    }

    return imports + exportStr + `};`;
  }

  private prepareEnvSetString(): string {
    return '1111';
  }

  private rollup() {

  }

  private makeImportString(defaultImportName: string, pathToFile: string): string {
    return `import ${defaultImportName} from '${pathToFile}';\n`;
  }

}
