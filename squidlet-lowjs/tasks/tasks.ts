import * as path from 'path';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import PlatformConfig from '../../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';


gulp.task('build-devs', async () => {

  //console.log(yargs.argv)

  // TODO: считываем конфиг машины, берем devs
  //       билдим devs только ts в /esp32-wrover/devs

  // TODO: нужно ещё как-то передать конфиг в configWorks

  const machineConfigFilePath: string = `./${yargs.argv.machine}.ts`;
  const machineConfig: PlatformConfig = require(machineConfigFilePath);
});
