import _trim = require('lodash/trim');
import Io, {SpawnCmdResult} from '../shared/Io';
import Starter from '../nodejs/starter/Starter';


interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  prod?: boolean;
}


export default class CommandStart {
  private readonly args: CommandStartArgs;
  private readonly configPath: string;
  private readonly isProd: boolean;
  private readonly io: Io = new Io();


  constructor(positionArgs: string[], args: CommandStartArgs) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.args = args;
    this.configPath = positionArgs[0];
    this.isProd = Boolean(args.prod);
  }


  async start() {
    const machine: string = await this.resolveMachine();
    const starter: Starter = new Starter(machine, this.configPath, this.args.name);

    await starter.init();

    if (this.isProd) {
      await starter.startProd();
    }
    else {
      await starter.startDev();
    }
  }


  private async resolveMachine(): Promise<string> {
    if (this.args.machine) return this.args.machine;

    const spawnResult: SpawnCmdResult = await this.io.spawnCmd('hostnamectl');

    if (spawnResult.status !== 0) {
      throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
    }

    const {os, arch} = this.parseHostNameCtlResult(spawnResult.stdout.join('\n'));

    if (arch.match(/x86/)) {
      // no matter which OS and 32 or 64 bits
      return 'x86';
    }
    else if (arch === 'arm') {
      // TODO: use cpuinfo to resolve Revision or other method
      if (os.match(/Raspbian/)) {
        return 'rpi';
      }
      else {
        return 'arm';
      }
    }

    throw new Error(`Unsupported architecture "${arch}"`);
  }

  private parseHostNameCtlResult(stdout: string): {os: string, arch: string} {
    const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
    const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

    if (!osMatch) {
      throw new Error(`Can't resolve an operating system of the machine`);
    }
    else if (!architectureMatch) {
      throw new Error(`Can't resolve an architecture of the machine`);
    }

    return {
      os: _trim(osMatch[1]),
      arch: architectureMatch[1],
    };
  }

}
