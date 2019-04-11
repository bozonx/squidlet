import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as _ from 'lodash';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as rimraf from 'rimraf';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import compileTs from '../helpers/buildJs/compileTs';
import compileJs from '../helpers/buildJs/compileJs';
import makeBuildConfig from '../helpers/buildJs/buildConfig';
import BuildConfig from '../hostEnvBuilder/interfaces/BuildConfig';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import minimize from '../helpers/buildJs/minimize';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {resolveParamRequired} from '../helpers/buildHelpers';


const buildDir: string = path.resolve(__dirname, `../build/lowjs`);
const hostSrcDir = path.resolve(__dirname, '../build/host/dev');
// TODO: use min
const HOST_DEVS_DIR = 'devs';
const HOST_DIR = 'host';
const HOST_ENV = 'env';
const TMP_ENV = 'tmpEnv';
const MODULES_DIR = 'node_modules';
const mainNodeModulesDir = path.resolve(__dirname, '../node_modules');


function copyDevs(hostBuildDir: string, machineDevs: string[], devSrcDir: string) {
  const devsDstDir: string = path.join(hostBuildDir, HOST_DEVS_DIR);

  rimraf.sync(`${devsDstDir}/**/*`);
  shelljs.mkdir('-p', devsDstDir);

  // copy specified devs
  for (let devName of machineDevs) {
    const devSrcFile: string = path.join(devSrcDir, `${devName}.js`);

    shelljs.cp('-f', devSrcFile, devsDstDir);
  }
}

function copyHost(hostBuildDir: string) {
  const hostDstDir: string = path.join(hostBuildDir, MODULES_DIR, HOST_DIR);

  shelljs.mkdir('-p', hostDstDir);
  rimraf.sync(`${hostDstDir}/**/*`);
  shelljs.cp('-Rf', `${hostSrcDir}/*`, hostDstDir);
}

function copyThirdPartyDeps(hostBuildDir: string) {
  const nodeModules: string = path.join(hostBuildDir, MODULES_DIR);
  const babelDir = path.join(nodeModules, '@babel');
  const babelRuntimeHelpersDir = path.join(babelDir, 'runtime/helpers');
  const babelHelpers = [
    'interopRequireDefault',
    'toConsumableArray',
    'classCallCheck',
    'createClass',
    'possibleConstructorReturn',
    'getPrototypeOf',
    'inherits',
  ];

  rimraf.sync(`${babelDir}/**/*`);
  shelljs.mkdir('-p', babelRuntimeHelpersDir);

  for (let fileName of babelHelpers) {
    const srcBabelDir = path.resolve(mainNodeModulesDir, '@babel/runtime/helpers', `${fileName}.js`);

    shelljs.cp(srcBabelDir , babelRuntimeHelpersDir);
  }
}

async function buildEnv(hostBuildDir: string, envConfigPath: string, envTmpDir: string) {
  const envDstDir: string = path.join(hostBuildDir, HOST_ENV);
  const envBuilder: EnvBuilder = new EnvBuilder(envConfigPath, envDstDir, envTmpDir);

  shelljs.mkdir('-p', envDstDir);
  rimraf.sync(`${envDstDir}/**/*`);
  await envBuilder.collect();
  await envBuilder.writeConfigs();
  await envBuilder.writeEntities();
}


gulp.task('build-lowjs-devs', async () => {
  const buildConfig: BuildConfig = makeBuildConfig(__dirname, buildDir);

  // ts to modern js
  rimraf.sync(`${buildConfig.devsModernDst}/**/*`);
  await compileTs(buildConfig.devsSrc, buildConfig.devsModernDst);
  // modern js to ES5
  rimraf.sync(`${buildConfig.devsLegacyDst}/**/*`);
  await compileJs(buildConfig.devsModernDst, buildConfig.devsLegacyDst, false);
  // minimize
  rimraf.sync(`${buildConfig.devsMinDst}/**/*`);
  await minimize(buildConfig.devsLegacyDst, buildConfig.devsMinDst);
});

gulp.task('build-lowjs', async () => {
  const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
  const envConfigPath = path.resolve(process.cwd(), resolvedConfigPath);
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

  console.info(`===> Build host ${envConfig.id} to machine ${envConfig.machine}`);

  const machineConfigFilePath: string = path.resolve(__dirname, `./lowjs-${envConfig.machine}.ts`);
  const machineConfig: MachineConfig = require(machineConfigFilePath).default;
  const hostBuildDir: string = path.join(buildDir, envConfig.id);
  const envTmpDir: string = path.join(buildDir, TMP_ENV, envConfig.id,);

  console.info(`- copy devs`);
  // TODO: use devsMinyDst
  copyDevs(hostBuildDir, machineConfig.devs, buildConfig.devsLegacyDst);
  console.info(`- copy host`);
  copyHost(hostBuildDir);
  console.info(`- copy third party dependencies`);
  copyThirdPartyDeps(hostBuildDir);
  console.info(`===> Build configs and entities`);
  await buildEnv(hostBuildDir, envConfigPath, envTmpDir);
});
