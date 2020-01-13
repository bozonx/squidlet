import StartDevelop from '../platforms/nodejs/starters/StartDevelop';
import StartIoServerStandalone from '../platforms/nodejs/starters/StartIoServerStandalone';
import StartRemoteDevelop from '../platforms/nodejs/starters/StartRemoteDevelop';
import {listenScriptEnd} from '../shared/helpers/helpers';
import Starter from '../platforms/nodejs/interfaces/Starter';
import StarterProps from '../platforms/nodejs/interfaces/StarterProps';
import {omitObj} from '../system/lib/objects';


export default class CommandStart {
  private readonly configPath: string;
  private readonly starterProps: StarterProps;


  constructor(positionArgs: string[], args: {[index: string]: any}) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.configPath = positionArgs[0];
    this.starterProps = {
      ...omitObj(args, 'name'),
      hostName: args.name,
    };
  }


  startProd(): Promise<void> {
    throw new Error(`Prod build isn't supported at the moment`);
    // const starter = new StartProd(this.configPath, this.starterProps);
    // return this.startApp(starter);
  }

  /**
   * Start in development mode and connect to the remote IO server. All the entities will be load
   * from local ts files.
   */
  startDevRemote(ioset: string): Promise<void> {
    const starter = new StartRemoteDevelop(
      this.configPath,
      this.starterProps.logLevel,
      this.starterProps.hostName,
      ioset,
    );

    return this.startApp(starter);
  }

  /**
   * Start in common develop mode. All the IOs and entities will be load from local ts files.
   */
  startDevSrc(): Promise<void> {
    const starter = new StartDevelop(this.configPath, this.starterProps);

    return this.startApp(starter);
  }

  /**
   * Start development platforms server on nodejs
   */
  startIoServer(): Promise<void> {
    const starter = new StartIoServerStandalone(this.configPath, this.starterProps);

    return this.startApp(starter);
  }


  private async startApp(starter: Starter) {
    listenScriptEnd(() => this.gracefullyDestroyCb(starter.destroy));
    await starter.init();
    await starter.start();
  }

  private gracefullyDestroyCb = async (destroy: () => Promise<void>) => {
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
