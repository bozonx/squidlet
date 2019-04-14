import * as path from 'path';
import * as yargs from 'yargs';
import {resolveSquidletRoot} from '../../shared/helpers';


/**
 * Resolve arguments or env variable
 */
export default class ResolveArgs {
  readonly machine: string;
  configPath: string = '';
  squidletRoot: string = '';
  workDir?: string;
  hostName?: string;


  constructor(machine: string) {
    this.machine = machine;
  }


  resolve() {
    if (!yargs.argv._[0]) {
      throw new Error(`You have to specify a host config or group config and host name.`);
    }

    this.configPath = yargs.argv._[0];
    this.squidletRoot = resolveSquidletRoot();

    // TODO: проверить что будет именно workDir а не work-dir
    if (yargs.argv.workDir) {
      this.workDir = path.resolve(process.cwd(), yargs.argv.workDir as string);
    }

    this.hostName = yargs.argv.name as any;
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
