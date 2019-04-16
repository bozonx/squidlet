import * as path from 'path';

import Io from '../shared/Io';
import Starter from '../nodejs/starter/Starter';


//const nodejsRoot = path.resolve(__dirname, '../nodejs');


export default class CommandStart {
  //private readonly positionArgs: string[];
  private readonly groupConfigPath: string;
  private readonly isProd: boolean;
  private readonly io: Io = new Io();


  constructor(positionArgs: string[], args: {[index: string]: string}) {
    if (positionArgs.length !== 2) {
      throw new Error(`You should specify a group config path`);
    }

    //this.positionArgs = positionArgs;
    this.groupConfigPath = positionArgs[0];
    this.isProd = Boolean(args.prod);
  }


  async start() {
    const machine: string = await this.resolveMachine();
    // TODO: resolve dev or prod

    const starter: Starter = new Starter(machine);

    await starter.init();

    if (this.isProd) {
      await starter.startProd();
    }
    else {
      await starter.startDev();
    }
  }


  private async resolveMachine(): Promise<string> {
    // TODO: resolve machine
  }

}
