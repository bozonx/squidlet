import StartDevelop from '../nodejs/starters/StartDevelop';
import StartProd from '../nodejs/starters/StartProd';
import StartIoServerStandalone from '../nodejs/starters/StartIoServerStandalone';
import LogLevel from '../system/interfaces/LogLevel';
import StartRemoteDevelop from '../nodejs/starters/StartRemoteDevelop';
import {listenScriptEnd} from '../shared/helpers';


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

    await starter.init();
    await starter.start();


    this.listenDestroySignals(systemKind.destroy);
  }


  // TODO: move upper ???
  private listenDestroySignals(destroy: () => Promise<void>) {
    listenScriptEnd(() => this.gracefullyDestroyCb(destroy));
  }

  // TODO: move upper ???
  private gracefullyDestroyCb = async (destroy: () => Promise<void>) => {
    // TODO: првоерить если система ещё не проинициализровалась

    setTimeout(() => {
      console.error(`ERROR: App hasn't been gracefully destroyed during "${this.props.destroyTimeoutSec}" seconds`);
      this.os.processExit(3);
    }, this.props.destroyTimeoutSec * 1000);

    try {
      await destroy();
      this.os.processExit(0);
    }
    catch (err) {
      console.error(err);
      this.os.processExit(2);
    }
  }

}
