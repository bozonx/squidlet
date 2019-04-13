import * as path from 'path';
import * as yargs from 'yargs';
import {HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME} from '../../control/constants';


/**
 * Resolve arguments or env variable
 */
export default class ResolveArgs {
  readonly machine: string;
  configPath: string = '';
  squidletRoot: string = '';
  hostName?: string;


  constructor(machine: string) {
    this.machine = machine;
  }


  resolve() {
    if (!yargs.argv._[0]) {
      throw new Error(`You have to specify a host config or group config and host name.`);
    }

    this.configPath = yargs.argv._[0];
    this.squidletRoot = this.resolveSquidletRoot();
    this.hostName = yargs.argv.name as any;
  }


  /**
   * If SQUIDLET_ROOT environment variable is set, it will be used.
   * Else use default dir.
   * If $XDG_DATA_HOME is either not set or empty, a default equal to $HOME/.local/share should be used.
   */
  private resolveSquidletRoot(): string {
    const envVar: string | undefined = process.env['SQUIDLET_ROOT'];
    const xdgDataHome: string | undefined = process.env['XDG_DATA_HOME'];

    if (envVar) return envVar;

    if (xdgDataHome) {
      return path.join(xdgDataHome, SQUIDLET_ROOT_DIR_NAME);
    }

    return path.join(process.env['HOME'] as string, HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME);
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
