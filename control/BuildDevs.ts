import * as path from 'path';

import Io from '../shared/Io';
import compileTs from '../shared/buildToJs/compileTs';
import compileJs from '../shared/buildToJs/compileJs';
import minimize from '../shared/buildToJs/minimize';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {loadMachineConfig, parseDevName, resolvePlatformDir} from '../shared/helpers';
import {
  BUILD_DEVS_DIR,
  DEV_SET_FILE,
  LEGACY_DIR,
  MODERN_DIR, ORIGINAL_DIR,
} from '../shared/constants';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';


export default class BuildDevs {
  private readonly preHostConfig: PreHostConfig;
  private readonly devsBuildDir: string;
  private readonly devsTmpDir: string;
  private readonly hostId: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly io: Io;


  constructor(io: Io, preHostConfig: PreHostConfig, hostsBuildDir: string, hostsTmpDir: string) {
    if (!preHostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }
    else if (!preHostConfig.platform) {
      throw new Error(`Host config doesn't have a platform param`);
    }
    else if (!preHostConfig.machine) {
      throw new Error(`Host config doesn't have a machine param`);
    }

    this.hostId = preHostConfig.id;
    this.platform = preHostConfig.platform;
    this.machine = preHostConfig.machine;
    this.preHostConfig = preHostConfig;
    this.devsBuildDir = path.join(hostsBuildDir, this.hostId, BUILD_DEVS_DIR);
    this.devsTmpDir = path.join(hostsTmpDir, this.hostId, BUILD_DEVS_DIR);
    this.io = io;
  }


  async build() {
    console.info(`--> Build devs of platform: "${this.platform}", machine ${this.machine}`);

    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    await this.copyDevs(machineConfig);
    await this.buildDevs();
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
      const devSrcFile: string = path.resolve(platformDir, devPath);

      // TODO: resolve sym link of devSrcFile

      console.log(1111111111111,  await this.io.readlink(devSrcFile));


      const devDstFile: string = path.join(usedDevsDir, path.basename(devPath));

      await this.io.copyFile(devSrcFile, devDstFile);
    }
  }

  /**
   * Build devs from whole original dir to envset/devs
   */
  private async buildDevs() {
    const original = path.join(this.devsTmpDir, ORIGINAL_DIR);
    const modernDst = path.join(this.devsTmpDir, MODERN_DIR);
    const legacyDst = path.join(this.devsTmpDir, LEGACY_DIR);

    // TODO: support dependencies (helpers)

    // ts to modern js
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(original, modernDst);
    // modern js to ES5
    await this.io.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // minimize
    await this.io.rimraf(`${this.devsBuildDir}/**/*`);
    await minimize(legacyDst, this.devsBuildDir);
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

}
