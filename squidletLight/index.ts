import * as yargs from 'yargs';
import * as path from 'path';

import {consoleError} from '../system/lib/helpers';
import Platforms from '../system/interfaces/Platforms';
import LogLevel from '../system/interfaces/LogLevel';
import AppBuilder from './AppBuilder';


const hostConfigPath: string | undefined = yargs.argv._[0] as any;
const IO_SERVER_DEFAULT_HOST_CONFIG_PATH = path.join(__dirname, 'ioServerHostConfig.yaml');
const argOutputDir = yargs.argv.outputDir as string | undefined;
const platform = yargs.argv.platform as Platforms | undefined;
const machine = yargs.argv.machine as string | undefined;
const minimize = yargs.argv.minimize !== 'false';
const logLevel = yargs.argv.logLevel as LogLevel | undefined;
const ioServer = yargs.argv.ioServer === 'true';


if (!platform) {
  console.error(`--platform is required`);
  process.exit(2);
}
else if (!machine) {
  console.error(`--machine is required`);
  process.exit(2);
}
else if (!ioServer && !hostConfigPath) {
  console.error(`host config is required`);
  process.exit(2);
}


const builder = new AppBuilder(
  platform,
  machine,
  hostConfigPath || IO_SERVER_DEFAULT_HOST_CONFIG_PATH,
  argOutputDir,
  minimize,
  logLevel,
  ioServer
);

builder.build()
  .catch(consoleError);
