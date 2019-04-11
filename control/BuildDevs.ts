import * as path from 'path';

import Io from '../hostEnvBuilder/Io';
import BuildConfig from '../hostEnvBuilder/interfaces/BuildConfig';
import makeBuildConfig from '../buildToJs/buildConfig';
import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import minimize from '../buildToJs/minimize';
import * as rimraf from '../lowjs/tasks';
import * as shelljs from 'shelljs';
import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfig, resolvePlatformDir} from './helpers';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {LEGACY_DIR, MIN_DIR, MODERN_DIR, PLATFORM_DEVS_DIR} from './constants';


const hostSrc = path.resolve(__dirname, '../host');


export default class BuildDevs {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build(platform: Platforms, machine: string, buildDir: string, tmpDir: string) {
    console.info(`--> Build devs of platrorm: "${platform}", machine ${machine}`);

    const machineConfig: MachineConfig = loadMachineConfig(platform, machine);

    const devsSrc = path.join(resolvePlatformDir(platform), PLATFORM_DEVS_DIR);
    const modernDst = path.join(tmpDir, MODERN_DIR);
    const legacyDst = path.join(tmpDir, LEGACY_DIR);
    const minDst = path.join(tmpDir, MIN_DIR);

    /*
    {
      devsModernDst: path.resolve(buildDir, `./_devs_modern`),
      devsLegacyDst: path.resolve(buildDir, `./_devs_legacy`),
      devsMinDst: path.resolve(buildDir, `./_devs_min`),
      devsSrc: path.resolve(rootDir, './devs'),
    }
    */

    // ts to modern js
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(buildConfig.devsSrc, modernDst);
    // modern js to ES5
    await this.io.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // minimize
    await this.io.rimraf(`${minDst}/**/*`);
    await minimize(legacyDst, minDst);
  }

  copyDevs(hostBuildDir: string, machineDevs: string[], devSrcDir: string) {
    const devsDstDir: string = path.join(hostBuildDir, HOST_DEVS_DIR);

    rimraf.sync(`${devsDstDir}/**/*`);
    shelljs.mkdir('-p', devsDstDir);

    // copy specified devs
    for (let devName of machineDevs) {
      const devSrcFile: string = path.join(devSrcDir, `${devName}.js`);

      shelljs.cp('-f', devSrcFile, devsDstDir);
    }
  }

}
