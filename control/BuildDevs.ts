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


const hostSrc = path.resolve(__dirname, '../host');


export default class BuildDevs {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build(machine: string, buildDir: string, tmpDir: string) {
    console.info(`===> Build host ${envConfig.id} to machine ${envConfig.machine}`);

    const machineConfigFilePath: string = path.resolve(__dirname, `./lowjs-${envConfig.machine}.ts`);
    const machineConfig: MachineConfig = require(machineConfigFilePath).default;

    /*
    {
      devsModernDst: path.resolve(buildDir, `./_devs_modern`),
      devsLegacyDst: path.resolve(buildDir, `./_devs_legacy`),
      devsMinDst: path.resolve(buildDir, `./_devs_min`),
      devsSrc: path.resolve(rootDir, './devs'),
    }
    */

    // ts to modern js
    await this.io.rimraf(`${buildConfig.devsModernDst}/**/*`);
    await compileTs(buildConfig.devsSrc, buildConfig.devsModernDst);
    // modern js to ES5
    await this.io.rimraf(`${buildConfig.devsLegacyDst}/**/*`);
    await compileJs(buildConfig.devsModernDst, buildConfig.devsLegacyDst, false);
    // minimize
    await this.io.rimraf(`${buildConfig.devsMinDst}/**/*`);
    await minimize(buildConfig.devsLegacyDst, buildConfig.devsMinDst);
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
