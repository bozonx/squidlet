import * as path from 'path';

import Io from './Io';
import compileTs from './buildToJs/compileTs';
import compileJs from './buildToJs/compileJs';
import minimize from './buildToJs/minimize';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {loadMachineConfig, parseDevName, resolvePlatformDir} from './helpers';
import {
  DEV_SET_FILE,
  LEGACY_DIR,
  MODERN_DIR,
  ORIGINAL_DIR,
} from './constants';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import {Stats} from '../system/interfaces/dev/StorageDev';


export default class IoBuilder {
  private readonly preHostConfig: PreHostConfig;
  private readonly devsBuildDir: string;
  private readonly devsTmpDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly io: Io;


  constructor(io: Io, preHostConfig: PreHostConfig, hostsBuildDir: string, hostsTmpDir: string) {
    if (!preHostConfig.platform) {
      throw new Error(`Host config doesn't have a platform param`);
    }
    else if (!preHostConfig.machine) {
      throw new Error(`Host config doesn't have a machine param`);
    }

    this.platform = preHostConfig.platform;
    this.machine = preHostConfig.machine;
    this.preHostConfig = preHostConfig;
    this.devsBuildDir = hostsBuildDir;
    this.devsTmpDir = hostsTmpDir;
    this.io = io;
  }


  async build() {
    console.info(`--> Build devs of platform: "${this.platform}", machine "${this.machine}"`);

    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    await this.io.rimraf(`${this.devsBuildDir}/**/*`);
    await this.io.mkdirP(this.devsBuildDir);

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

    await this.io.rimraf(`${usedDevsDir}/**/*`);
    await this.io.mkdirP(usedDevsDir);

    // copy specified devs
    for (let devPath of machineConfig.devs) {
      const absFilePath: string = path.resolve(platformDir, devPath);
      const srcFile: string = await this.resolveFileTargetPath(absFilePath);
      const dstFile: string = path.join(usedDevsDir, path.basename(devPath));

      await this.io.copyFile(srcFile, dstFile);
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
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(original, modernDst);
    // modern js to ES5
    await this.io.rimraf(`${legacyDst}/**/*`);
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

      await this.io.copyFile(srcFile, dstFile);
    }
  }

  /**
   * Make index.js which requires all the devs.
   */
  private async makeDevSetIndex(machineConfig: MachineConfig) {
    const indexFilePath: string = path.join(this.devsBuildDir, DEV_SET_FILE);
    const devs: string[] = [];

    for (let devPath of machineConfig.devs) {
      const devName: string = parseDevName(devPath);
      const devString = `${devName}: require("./${devName}")`;

      devs.push(devString);
    }

    const devSet: string = `module.exports = {\n${devs.join(',\n')}\n};\n`;

    await this.io.writeFile(indexFilePath, devSet);
  }

  /**
   * If it is a sym link - it returns an absolute path to its target.
   * If it a regular file - it returns filePath as is.
   */
  private async resolveFileTargetPath(filePath: string): Promise<string> {
    const stat: Stats = await this.io.stat(filePath);

    if (!stat.symbolicLink) return filePath;

    const linkTo: string = await this.io.readlink(filePath);

    return path.resolve(path.dirname(filePath), linkTo);
  }

}
