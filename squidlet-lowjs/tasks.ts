import * as path from 'path';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import PlatformConfig from '../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';
import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';


const BUILD_DIR = path.resolve(__dirname, `./build`);
const BUILD_DEVS_MODERN = path.resolve(__dirname, `./build/_devs_modern`);
const BUILD_DEVS_ES5 = path.resolve(__dirname, `./build/_devs_es5`);
const DEVS_DIR = path.resolve(__dirname, `./devs`);
const machineName: string = yargs.argv.machine as string;


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
  const machineBuildDir: string = path.resolve(BUILD_DIR, machineName);

  await compileTs(DEVS_DIR, BUILD_DEVS_MODERN);
  //await compileJs(buildConfig.compiledTsDir, buildConfig.compiledJsDir, buildConfig.strictMode);

  // for (let devName of machineConfig.devs) {
  //   const devFilePath: string = path.resolve(__dirname, `./${devName}.ts`);
  //
  // }
});
