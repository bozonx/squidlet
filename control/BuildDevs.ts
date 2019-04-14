import * as path from 'path';

import Io from '../shared/Io';
import compileTs from '../shared/buildToJs/compileTs';
import compileJs from '../shared/buildToJs/compileJs';
import minimize from '../shared/buildToJs/minimize';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {loadMachineConfig, resolvePlatformDir} from './helpers';
import {
  BUILD_DEVS_DIR,
  DEV_SET_FILE,
  LEGACY_DIR,
  MIN_DIR,
  MODERN_DIR,
  PLATFORM_DEVS_DIR
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

    await this.buildDevs();
    await this.copyDevs(machineConfig);
    await this.makeDevSet(machineConfig);
  }

  private async buildDevs() {
    const devsSrc = path.join(resolvePlatformDir(this.platform), PLATFORM_DEVS_DIR);
    const modernDst = path.join(this.devsTmpDir, MODERN_DIR);
    const legacyDst = path.join(this.devsTmpDir, LEGACY_DIR);
    const minDst = path.join(this.devsTmpDir, MIN_DIR);

    // ts to modern js
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(devsSrc, modernDst);
    // modern js to ES5
    await this.io.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // minimize
    await this.io.rimraf(`${minDst}/**/*`);
    await minimize(legacyDst, minDst);
  }

  private async copyDevs(machineConfig: MachineConfig) {
    const minDst = path.join(this.devsTmpDir, MIN_DIR);

    await this.io.rimraf(`${this.devsBuildDir}/**/*`);
    await this.io.mkdirP(this.devsBuildDir);

    // copy specified devs
    for (let devName of machineConfig.devs) {
      const fileName = `${devName}.js`;
      const devSrcFile: string = path.join(minDst, fileName);
      const devDstFile: string = path.join(this.devsBuildDir, fileName);

      await this.io.copyFile(devSrcFile, devDstFile);
    }
  }

  private async makeDevSet(machineConfig: MachineConfig) {
    const indexFilePath: string = path.join(this.devsBuildDir, DEV_SET_FILE);
    const devs: string[] = [];

    for (let devName of machineConfig.devs) {
      const devFile = `./${devName}.js`;
      const devString = `${devName}: require("${devFile}")`;

      devs.push(devString);
    }

    const devSet: string = `module.exports = {\n${devs.join(',\n')}\n};\n`;

    await this.io.writeFile(indexFilePath, devSet);
  }

}
