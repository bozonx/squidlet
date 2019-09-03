import * as path from 'path';

import Os from '../Os';
import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import minimize from '../buildToJs/minimize';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../../system/interfaces/Platforms';
import {getFileNameOfPath, loadMachineConfigInPlatformDir, resolvePlatformDir} from '../helpers';
import {
  IO_SET_INDEX_FILE,
  LEGACY_DIR,
  MODERN_DIR,
  ORIGINAL_DIR,
} from '../constants';
import {StatsSimplified} from '../../system/interfaces/io/StorageIo';
import {OwnerOptions} from '../interfaces/OnwerOptions';


export default class BuildIo {
  private readonly iosBuildDir: string;
  private readonly iosTmpDir: string;
  private readonly ownerOptions: OwnerOptions;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly os: Os;


  constructor(
    os: Os,
    platform: Platforms,
    machine: string,
    iosBuildDir: string,
    iosTmpDir: string,
    ownerOptions: OwnerOptions
  ) {
    this.platform = platform;
    this.machine = machine;
    this.iosBuildDir = iosBuildDir;
    this.iosTmpDir = iosTmpDir;
    this.ownerOptions = ownerOptions;
    this.os = os;
  }


  async build() {
    console.info(`--> Build ios of platform: "${this.platform}", machine "${this.machine}"`);

    const platformDir = resolvePlatformDir(this.platform);
    const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(this.os, platformDir, this.machine);

    await this.os.rimraf(`${this.iosBuildDir}/**/*`);
    await this.os.mkdirP(this.iosBuildDir, this.ownerOptions);

    await this.copyIos(machineConfig);
    await this.buildIos();
    await this.copySupportFiles(machineConfig);
    await this.makeIoSetIndex(machineConfig);
  }


  /**
   * Copy only used ios
   */
  private async copyIos(machineConfig: MachineConfig) {
    const usedIosDir = path.join(this.iosTmpDir, ORIGINAL_DIR);
    const platformDir = resolvePlatformDir(this.platform);

    await this.os.rimraf(`${usedIosDir}/**/*`);
    await this.os.mkdirP(usedIosDir, this.ownerOptions);

    // copy specified ios
    for (let devPath of machineConfig.ios) {
      const absFilePath: string = path.resolve(platformDir, devPath);
      const srcFile: string = await this.resolveFileTargetPath(absFilePath);
      const dstFile: string = path.join(usedIosDir, path.basename(devPath));

      await this.os.copyFile(srcFile, dstFile, this.ownerOptions);
    }
  }

  /**
   * Build ios from whole original dir to envset/ios
   */
  private async buildIos() {
    const original = path.join(this.iosTmpDir, ORIGINAL_DIR);
    const modernDst = path.join(this.iosTmpDir, MODERN_DIR);
    const legacyDst = path.join(this.iosTmpDir, LEGACY_DIR);

    // ts to modern js
    await this.os.rimraf(`${modernDst}/**/*`);
    await compileTs(original, modernDst);
    // modern js to ES5
    await this.os.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // minimize
    await minimize(legacyDst, this.iosBuildDir);
  }

  /**
   * Copy support files
   */
  private async copySupportFiles(machineConfig: MachineConfig) {
    if (!machineConfig.iosSupportFiles) return;

    const platformDir = resolvePlatformDir(this.platform);

    for (let supportFilePath of machineConfig.iosSupportFiles) {
      const absFilePath: string = path.resolve(platformDir, supportFilePath);
      const srcFile: string = await this.resolveFileTargetPath(absFilePath);
      const dstFile: string = path.join(this.iosBuildDir, path.basename(supportFilePath));

      await this.os.copyFile(srcFile, dstFile, this.ownerOptions);
    }
  }

  /**
   * Make index.js which requires all the io files.
   */
  private async makeIoSetIndex(machineConfig: MachineConfig) {
    const indexFilePath: string = path.join(this.iosBuildDir, IO_SET_INDEX_FILE);
    const ios: string[] = [];

    for (let devPath of machineConfig.ios) {
      const devName: string = getFileNameOfPath(devPath);
      const ioString = `${devName}: require("./${devName}").default`;

      ios.push(ioString);
    }

    const ioSet: string = `module.exports = {\n${ios.join(',\n')}\n};\n`;

    await this.os.writeFile(indexFilePath, ioSet, this.ownerOptions);
  }

  /**
   * If it is a sym link - it returns an absolute path to its target.
   * If it a regular file - it returns filePath as is.
   */
  private async resolveFileTargetPath(filePath: string): Promise<string> {
    const stat: StatsSimplified = await this.os.stat(filePath);

    if (!stat.symbolicLink) return filePath;

    const linkTo: string = await this.os.readlink(filePath);

    return path.resolve(path.dirname(filePath), linkTo);
  }

}
