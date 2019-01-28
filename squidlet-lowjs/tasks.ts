import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as _ from 'lodash';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';

import PlatformConfig from '../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';
import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';
import makeBuildConfig from '../squidlet-starter/buildJs/buildConfig';
import BuildConfig from '../squidlet-starter/buildHostEnv/interfaces/BuildConfig';
import PreHostConfig from '../squidlet-starter/buildHostEnv/interfaces/PreHostConfig';


const envConfigRelPath: string = yargs.argv.config as string;


gulp.task('build-devs', async () => {
  const buildConfig: BuildConfig = makeBuildConfig(__dirname);

  await compileTs(buildConfig.devsSrc, buildConfig.devsModersDst);
  await compileJs(buildConfig.devsModersDst, buildConfig.devsLegacyDst, false);
});

gulp.task('build', async () => {
  if (!envConfigRelPath) {
    throw new Error(`You have to specify a machine name`);
  }

  const envConfigPath = path.resolve(process.cwd(), envConfigRelPath);
  const envConfig: PreHostConfig = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
  const buildConfig: BuildConfig = _.defaultsDeep({}, envConfig.buildConfig, makeBuildConfig(__dirname));

  if (!envConfig.machine) {
    throw new Error(`You have to specify a "machine" param in your host config`);
  }
  else if (!envConfig.id) {
    throw new Error(`You have to specify an "id" param in your host config`);
  }

  const machineConfigFilePath: string = path.resolve(__dirname, `./${envConfig.machine}.ts`);
  const machineConfig: PlatformConfig = require(machineConfigFilePath).default;
  const hostBuildDir: string = path.join(buildConfig.buildDir, envConfig.id);
  const devsDstDir: string = path.join(hostBuildDir, 'devs');

  shelljs.mkdir('-p', devsDstDir);

  // copy specified devs
  for (let devName of machineConfig.devs) {
    const devSrcFile: string = path.join(buildConfig.devsLegacyDst, `${devName}.js`);

    shelljs.cp('-f', devSrcFile, devsDstDir);
  }

  // TODO: copy host
  // TODO: нужно ещё как-то передать конфиг в configWorks

});
