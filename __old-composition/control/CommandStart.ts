import StartDevelop from '../../../squidlet-networking/src/io/nodejs/starters/StartDevelop';
import StartIoServerStandalone from '../../../squidlet-networking/src/io/nodejs/starters/StartIoServerStandalone';
import StartRemoteDevelop from '../../../squidlet-networking/src/io/nodejs/starters/StartRemoteDevelop';
import {listenScriptEnd} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/helpers.js';
import Starter from '../../../squidlet-networking/src/io/nodejs/interfaces/Starter';
import StarterProps from '../../../squidlet-networking/src/io/nodejs/interfaces/StarterProps';
import {omitObj} from '../../../squidlet-lib/src/objects';


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
   * Start in common development mode on local machine.
   * All the IOs and entities will be load from local ts files.
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
    listenScriptEnd(starter.destroy);
    await starter.init();
    await starter.start();
  }

}
