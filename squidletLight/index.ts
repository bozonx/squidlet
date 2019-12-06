import * as yargs from 'yargs';

import builder from './squidletLightBuilder';
import {consoleError} from '../system/lib/helpers';
import Platforms from '../system/interfaces/Platforms';
import LogLevel from '../system/interfaces/LogLevel';


const hostConfigPath: string | undefined = yargs.argv._[0] as any;


builder(
  yargs.argv.platform as Platforms | undefined,
  yargs.argv.machine as string | undefined,
  yargs.argv.outputDir as string | undefined,
  yargs.argv.minimize !== 'false',
  yargs.argv.ioServer === 'true',
  yargs.argv.logLevel as LogLevel | undefined,
  hostConfigPath,
)
  .catch(consoleError);
