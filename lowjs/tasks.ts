import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as _ from 'lodash';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as rimraf from 'rimraf';

import PlatformConfig from '../hostEnvBuilder/interfaces/PlatformConfig';
import compileTs from '../helpers/buildJs/compileTs';
import compileJs from '../helpers/buildJs/compileJs';
import makeBuildConfig from '../helpers/buildJs/buildConfig';
import BuildConfig from '../hostEnvBuilder/interfaces/BuildConfig';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import minimize from '../helpers/buildJs/minimize';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';


const buildDir: string = path.resolve(__dirname, `../build/lowjs`);
const hostSrcDir = path.resolve(__dirname, '../build/host/dev');
const envConfigRelPath: string = yargs.argv.config as string;
// TODO: use min
const HOST_DEVS_DIR = 'devs';
const HOST_DIR = 'host';
const HOST_ENV = 'env';


function copyDevs(hostBuildDir: string, machineDevs: string[], devSrcDir: string) {
  const devsDstDir: string = path.join(hostBuildDir, HOST_DEVS_DIR);

  shelljs.mkdir('-p', devsDstDir);

  // copy specified devs
  for (let devName of machineDevs) {
    const devSrcFile: string = path.join(devSrcDir, `${devName}.js`);

    shelljs.cp('-f', devSrcFile, devsDstDir);
  }
}

function copyHost(hostBuildDir: string) {
  const hostDstDir: string = path.join(hostBuildDir, HOST_DIR);

  rimraf.sync(`${hostDstDir}/**/*`);
  shelljs.mkdir('-p', hostDstDir);
  shelljs.cp('-Rf', `${hostSrcDir}/*`, hostDstDir);
}

function buildEnv(hostBuildDir: string, envConfigPath: string) {
  const envDstDir: string = path.join(hostBuildDir, HOST_ENV);

  const envBuilder: EnvBuilder = new EnvBuilder();


  // TODO: нужно ещё как-то передать конфиг в configWorks

}


gulp.task('build-lowjs-devs', async () => {
  const buildConfig: BuildConfig = makeBuildConfig(__dirname, buildDir);

  // ts to modern js
  rimraf.sync(`${buildConfig.devsModersDst}/**/*`);
  await compileTs(buildConfig.devsSrc, buildConfig.devsModersDst);
  // modern js to ES5
  rimraf.sync(`${buildConfig.devsLegacyDst}/**/*`);
  await compileJs(buildConfig.devsModersDst, buildConfig.devsLegacyDst, false);
  // minimize
  rimraf.sync(`${buildConfig.devsMinDst}/**/*`);
  await minimize(buildConfig.devsLegacyDst, buildConfig.devsMinDst);
});

gulp.task('build-lowjs', async () => {
  if (!envConfigRelPath) {
    throw new Error(`You have to specify a machine name`);
  }

  const envConfigPath = path.resolve(process.cwd(), envConfigRelPath);
  const envConfig: PreHostConfig = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
  const buildConfig: BuildConfig = _.defaultsDeep(
    {},
    envConfig.buildConfig,
    makeBuildConfig(__dirname, buildDir)
  );

  if (!envConfig.machine) {
    throw new Error(`You have to specify a "machine" param in your host config`);
  }
  else if (!envConfig.id) {
    throw new Error(`You have to specify an "id" param in your host config`);
  }

  const machineConfigFilePath: string = path.resolve(__dirname, `./${envConfig.machine}.ts`);
  const machineConfig: PlatformConfig = require(machineConfigFilePath).default;
  const hostBuildDir: string = path.join(buildDir, envConfig.id);

  // TODO: use devsMinyDst
  copyDevs(hostBuildDir, machineConfig.devs, buildConfig.devsLegacyDst);
  copyHost(hostBuildDir);
  buildEnv(hostBuildDir, envConfigPath);
});
