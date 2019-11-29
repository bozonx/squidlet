import StartDevelop from '../nodejs/starters/StartDevelop';
import StartIoServerStandalone from '../nodejs/starters/StartIoServerStandalone';
import LogLevel from '../system/interfaces/LogLevel';
import StartRemoteDevelop from '../nodejs/starters/StartRemoteDevelop';
import {listenScriptEnd} from '../shared/helpers';
import {DESTROY_SYTEM_TIMEOUT_SEC} from '../nodejs/starters/constanats';
import Starter from '../nodejs/interfaces/Starter';
import StarterProps from '../nodejs/interfaces/StarterProps';


// TODO: review - может сделать ближе к StarterProps
interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  force?: boolean;
  logLevel?: LogLevel;
  user?: string;
  group?: string;
}


export default class CommandStart {
  private readonly configPath: string;
  private readonly args: CommandStartArgs;
  private readonly starterProps: StarterProps;


  constructor(positionArgs: string[], args: CommandStartArgs) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.configPath = positionArgs[0];
    this.args = args;
    this.starterProps = {
      configPath: this.configPath,
      argForce: this.args.force,
      argLogLevel: this.args.logLevel,
      argMachine: this.args.machine as any,
      argHostName: this.args.name,
      argWorkDir: this.args.workDir,
      argUser: this.args.user,
      argGroup: this.args.group,
    };
  }


  startProd(): Promise<void> {
    throw new Error(`Prod build isn't supported at the moment`);
    // const starter = new StartProd(this.starterProps);
    // return this.startApp(starter);
  }

  /**
   * Start in development mode and connect to the remote IO server. All the entities will be load
   * from local ts files.
   */
  startDevRemote(ioset: string): Promise<void> {
    const starter = new StartRemoteDevelop(
      this.configPath,
      this.args.logLevel,
      this.args.name,
      ioset,
    );

    return this.startApp(starter);
  }

  /**
   * Start in common develop mode. All the IOs and entities will be load from local ts files.
   */
  startDevSrc(): Promise<void> {
    // develop with local io set
    const starter = new StartDevelop(this.starterProps);

    return this.startApp(starter);
  }

  /**
   * Start development io server on nodejs
   */
  startIoServer(): Promise<void> {
    const starter = new StartIoServerStandalone(this.starterProps);

    return this.startApp(starter);
  }


  private async startApp(starter: Starter) {
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
