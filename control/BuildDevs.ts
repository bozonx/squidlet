import * as path from 'path';

import Io from '../hostEnvBuilder/Io';
import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import minimize from '../buildToJs/minimize';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {loadMachineConfig, resolvePlatformDir} from './helpers';
import {LEGACY_DIR, MIN_DIR, MODERN_DIR, PLATFORM_DEVS_DIR} from './constants';


export default class BuildDevs {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build(platform: Platforms, machine: string, buildDir: string, tmpDir: string) {
    console.info(`--> Build devs of platrorm: "${platform}", machine ${machine}`);

    const machineConfig: MachineConfig = loadMachineConfig(platform, machine);

    await this.buildDevs(platform, tmpDir);
    await this.copyDevs(machineConfig, buildDir, tmpDir);
    await this.makeDevSet(machineConfig);
  }

  private async buildDevs(platform: Platforms, tmpDir: string) {
    const devsSrc = path.join(resolvePlatformDir(platform), PLATFORM_DEVS_DIR);
    const modernDst = path.join(tmpDir, MODERN_DIR);
    const legacyDst = path.join(tmpDir, LEGACY_DIR);
    const minDst = path.join(tmpDir, MIN_DIR);

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

  private async copyDevs(machineConfig: MachineConfig, buildDir: string, tmpDir: string) {
    const minDst = path.join(tmpDir, MIN_DIR);

    await this.io.rimraf(`${buildDir}/**/*`);
    await this.io.mkdirP(buildDir);

    // copy specified devs
    for (let devName of machineConfig.devs) {
      const devSrcFile: string = path.join(minDst, `${devName}.js`);

      await this.io.copyFile(devSrcFile, buildDir);
    }
  }

  private async makeDevSet(machineConfig: MachineConfig) {
    // TODO: make it
  }

}
