import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import PlatformConfig from '../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';
import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';
import makeBuildConfig, {BuildConfig} from '../squidlet-starter/buildJs/buildConfig';


//const machineName: string = yargs.argv.machine as string;
const envConfig: string = yargs.argv.config as string;
const buildConfig: BuildConfig = makeBuildConfig(__dirname);
// TODO: move to env config
const strictMode: boolean = false;


// TODO: нужно ещё как-то передать конфиг в configWorks


gulp.task('build-devs', async () => {
  await compileTs(buildConfig.devsSrc, buildConfig.devsModersDst);
  await compileJs(buildConfig.devsModersDst, buildConfig.devsLegacyDst, strictMode);
});

gulp.task('build', async () => {
  // if (!machineName) {
  //   throw new Error(`You have to specify a machine name`);
  // }

  if (!envConfig) {
    throw new Error(`You have to specify a machine name`);
  }

  // const machineConfigFilePath: string = path.resolve(__dirname, `./${machineName}.ts`);
  // const machineConfig: PlatformConfig = require(machineConfigFilePath);
  // const machineBuildDir: string = path.join(config.buildDir, machineName);

  // // copy specified devs
  // for (let devName of machineConfig.devs) {
  //   const devSrcFile: string = path.join(config.devsLegacyDst, `${devName}.ts`);
  //   const devDstFile: string = path.join(machineBuildDir, `devs/${devName}.ts`);
  //
  //   console.log(111111111, devSrcFile, devDstFile)
  //
  //   shelljs.cp('-f', devSrcFile, devDstFile);
  // }
});
