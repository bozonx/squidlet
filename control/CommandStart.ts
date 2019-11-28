import StartDevelop from '../nodejs/starters/StartDevelop';
import StartProd from '../nodejs/starters/StartProd';
import StartIoServerStandalone from '../nodejs/starters/StartIoServerStandalone';
import LogLevel from '../system/interfaces/LogLevel';
import StartRemoteDevelop from '../nodejs/starters/StartRemoteDevelop';
import {listenScriptEnd} from '../shared/helpers';
import {DESTROY_SYTEM_TIMEOUT_SEC} from '../nodejs/starters/constanats';


interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  prod?: boolean;
  force?: boolean;
  logLevel?: LogLevel;
  user?: string;
  group?: string;
  ioset?: string;
}


export default class CommandStart {
  private readonly configPath: string;
  private readonly args: CommandStartArgs;


  constructor(positionArgs: string[], args: CommandStartArgs) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.configPath = positionArgs[0];
    this.args = args;
  }


  async start() {
    // run prod is specified
    if (this.args.prod) {
      const starter = new StartProd(
        this.configPath,
        this.args.force,
        this.args.logLevel,
        this.args.machine as any,
        this.args.name,
        this.args.workDir,
        this.args.user,
        this.args.group,
      );

      listenScriptEnd(() => this.gracefullyDestroyCb(starter.destroy));
      await starter.init();
      await starter.start();

      return;
    }

    // or run dev
    // with remote io set
    if (this.args.ioset) {
      const starter = new StartRemoteDevelop(
        this.configPath,
        this.args.logLevel,
        this.args.name,
        this.args.ioset,
      );

      listenScriptEnd(() => this.gracefullyDestroyCb(starter.destroy));
      await starter.init();
      await starter.start();

      return;
    }

    // with local io set
    const starter = new StartDevelop(
      this.configPath,
      this.args.force,
      this.args.logLevel,
      this.args.machine as any,
      this.args.name,
      this.args.workDir,
      this.args.user,
      this.args.group,
    );

    listenScriptEnd(() => this.gracefullyDestroyCb(starter.destroy));
    await starter.init();
    await starter.start();
  }

  /**
   * Start development io server on nodejs
   */
  async startIoServer() {
    const starter = new StartIoServerStandalone(
      this.configPath,
      this.args.force,
      this.args.logLevel,
      this.args.machine as any,
      this.args.name,
      this.args.workDir,
      this.args.user,
      this.args.group,
    );

    listenScriptEnd(() => this.gracefullyDestroyCb(starter.destroy));
    await starter.init();
    await starter.start();
  }


  private gracefullyDestroyCb = async (destroy: () => Promise<void>) => {
    setTimeout(() => {
      console.error(
        `ERROR: App hasn't been gracefully destroyed during "${DESTROY_SYTEM_TIMEOUT_SEC}" seconds`
      );
      process.exit(3);
    }, DESTROY_SYTEM_TIMEOUT_SEC * 1000);

    try {
      await destroy();
    }
    catch (err) {
      console.error(err);
      process.exit(2);
    }

    process.exit(0);
  }

}
