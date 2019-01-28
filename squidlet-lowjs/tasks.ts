import * as path from 'path';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import PlatformConfig from '../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';
import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';
import buildConfig, {BuildConfig} from '../squidlet-starter/buildJs/buildConfig';


const machineName: string = yargs.argv.machine as string;
const config: BuildConfig = buildConfig(__dirname);
// TODO: move to env config
const strictMode: boolean = false;


gulp.task('build-devs', async () => {
  if (!machineName) {
    throw new Error(`You have to specify a machine name`);
  }

  //console.log(yargs.argv)

  // TODO: считываем конфиг машины, берем devs
  //       билдим devs только ts в /esp32-wrover/devs

  // TODO: нужно ещё как-то передать конфиг в configWorks

  const machineConfigFilePath: string = path.resolve(__dirname, `./${machineName}.ts`);
  const machineConfig: PlatformConfig = require(machineConfigFilePath);
  const machineBuildDir: string = path.resolve(config.buildDir, machineName);

  await compileTs(config.devsSrc, config.devsModersDst);
  await compileJs(config.devsModersDst, config.devsLegacyDst, strictMode);

  // for (let devName of machineConfig.devs) {
  //   const devFilePath: string = path.resolve(__dirname, `./${devName}.ts`);
  //
  // }
});
