import * as path from 'path';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import PlatformConfig from '../../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';


const BUILD_DIR = path.resolve(__dirname, `./build`);


gulp.task('build-devs', async () => {
  if (!yargs.argv.machine) {
    throw new Error(`You have to specify a machine name`);
  }

  //console.log(yargs.argv)

  // TODO: считываем конфиг машины, берем devs
  //       билдим devs только ts в /esp32-wrover/devs

  // TODO: нужно ещё как-то передать конфиг в configWorks

  const machineConfigFilePath: string = path.resolve(__dirname, `./${yargs.argv.machine}.ts`);
  const machineConfig: PlatformConfig = require(machineConfigFilePath);
  const machineBuildDir: string = path.resolve(BUILD_DIR, yargs.argv.machine);

  for (let devName of machineConfig.devs) {
    const devFilePath: string = path.resolve(__dirname, `./${devName}.ts`);

  }
});
