import * as yargs from 'yargs';


/**
 * Resolve arguments or env variable
 */
export default class ResolveArgs {
  readonly machine: string;
  configPath: string = '';
  hostName?: string;
  workDir?: string;


  constructor(machine: string) {
    this.machine = machine;
  }


  resolve() {
    if (!yargs.argv._[0]) {
      throw new Error(`You have to specify a host config or group config and host name.`);
    }

    this.configPath = yargs.argv._[0];
    this.workDir = this.resolveParam('WORK_DIR', 'work-dir');
    this.hostName = yargs.argv.name as any;
  }


  private resolveParam(envParamName: string, argParamName?: string): string | undefined {
    if (process.env[envParamName]) {
      return process.env[envParamName];
    }

    else if (argParamName && yargs.argv[argParamName]) {
      return yargs.argv[argParamName] as string;
    }

    return;
  }

}