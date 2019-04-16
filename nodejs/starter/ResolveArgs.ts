// TODO: remove



import * as path from 'path';
import * as yargs from 'yargs';
import {resolveSquidletRoot} from '../../shared/helpers';




/**
 * Resolve arguments or env variable
 */
export default class ResolveArgs {
  configPath: string = '';
  squidletRoot: string = '';
  workDir?: string;
  hostName?: string;


  constructor() {
    if (!yargs.argv._[0]) {
      throw new Error(`You have to specify a host config or group config and host name.`);
    }

    const workDir: string | undefined = yargs.argv['work-dir'] as string | undefined;

    this.configPath = yargs.argv._[0];
    this.squidletRoot = resolveSquidletRoot();

    if (workDir) {
      this.workDir = path.resolve(process.cwd() ,workDir);
    }

    this.hostName = yargs.argv.name as any;

    console.log(1111111111111111, yargs.argv);
  }


  // private resolveParam(envParamName: string, argParamName?: string): string | undefined {
  //   if (process.env[envParamName]) {
  //     return process.env[envParamName];
  //   }
  //
  //   else if (argParamName && yargs.argv[argParamName]) {
  //     return yargs.argv[argParamName] as string;
  //   }
  //
  //   return;
  // }

}
