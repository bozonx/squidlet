import * as path from 'path';

import Os from './Os';
import compileTs from './buildToJs/compileTs';
import compileJs from './buildToJs/compileJs';
import minimize from './buildToJs/minimize';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {loadMachineConfig, parseDevName, resolvePlatformDir} from './helpers';
import {
  IO_SET_INDEX_FILE,
  LEGACY_DIR,
  MODERN_DIR,
  ORIGINAL_DIR,
} from './constants';
import {Stats} from '../system/interfaces/io/StorageDev';


export default class BuildIo {
  private readonly devsBuildDir: string;
  private readonly devsTmpDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly os: Os;


  constructor(os: Os, platform: Platforms, machine: string, hostsBuildDir: string, hostsTmpDir: string) {
    this.platform = platform;
    this.machine = machine;
    this.devsBuildDir = hostsBuildDir;
    this.devsTmpDir = hostsTmpDir;
    this.os = os;
  }


  async build() {
    console.info(`--> Build devs of platform: "${this.platform}", machine "${this.machine}"`);

    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    await this.os.rimraf(`${this.devsBuildDir}/**/*`);
    await this.os.mkdirP(this.devsBuildDir);

    await this.copyDevs(machineConfig);
    await this.buildDevs();
    await this.copySupportFiles(machineConfig);
    await this.makeDevSetIndex(machineConfig);
  }


  /**
   * Copy only used devs
   */
  private async copyDevs(machineConfig: MachineConfig) {
    const usedDevsDir = path.join(this.devsTmpDir, ORIGINAL_DIR);
    const platformDir = resolvePlatformDir(this.platform);

    await this.os.rimraf(`${usedDevsDir}/**/*`);
    await this.os.mkdirP(usedDevsDir);

    // copy specified devs
    for (let devPath of machineConfig.devs) {
      const absFilePath: string = path.resolve(platformDir, devPath);
      const srcFile: string = await this.resolveFileTargetPath(absFilePath);
      const dstFile: string = path.join(usedDevsDir, path.basename(devPath));

      await this.os.copyFile(srcFile, dstFile);
    }
  }

  /**
   * Build devs from whole original dir to envset/devs
   */
  private async buildDevs() {
    const original = path.join(this.devsTmpDir, ORIGINAL_DIR);
    const modernDst = path.join(this.devsTmpDir, MODERN_DIR);
    const legacyDst = path.join(this.devsTmpDir, LEGACY_DIR);

    // ts to modern js
    await this.os.rimraf(`${modernDst}/**/*`);
    await compileTs(original, modernDst);
    // modern js to ES5
    await this.os.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // minimize
    await minimize(legacyDst, this.devsBuildDir);
  }

  /**
   * Copy support files
   */
  private async copySupportFiles(machineConfig: MachineConfig) {
    if (!machineConfig.devsSupportFiles) return;

    const platformDir = resolvePlatformDir(this.platform);

    for (let supportFilePath of machineConfig.devsSupportFiles) {
      const absFilePath: string = path.resolve(platformDir, supportFilePath);
      const srcFile: string = await this.resolveFileTargetPath(absFilePath);
      const dstFile: string = path.join(this.devsBuildDir, path.basename(supportFilePath));

      await this.os.copyFile(srcFile, dstFile);
    }
  }

  /**
   * Make index.js which requires all the io files.
   */
  private async makeDevSetIndex(machineConfig: MachineConfig) {
    const indexFilePath: string = path.join(this.devsBuildDir, IO_SET_INDEX_FILE);
    const devs: string[] = [];

    for (let devPath of machineConfig.devs) {
      const devName: string = parseDevName(devPath);
      const devString = `${devName}: require("./${devName}")`;

      devs.push(devString);
    }

    const devSet: string = `module.exports = {\n${devs.join(',\n')}\n};\n`;

    await this.os.writeFile(indexFilePath, devSet);
  }

  /**
   * If it is a sym link - it returns an absolute path to its target.
   * If it a regular file - it returns filePath as is.
   */
  private async resolveFileTargetPath(filePath: string): Promise<string> {
    const stat: Stats = await this.os.stat(filePath);

    if (!stat.symbolicLink) return filePath;

    const linkTo: string = await this.os.readlink(filePath);

    return path.resolve(path.dirname(filePath), linkTo);
  }

}
