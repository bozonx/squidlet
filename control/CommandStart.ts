import * as path from 'path';

import Io from '../shared/Io';
import Starter from '../nodejs/starter/Starter';


//const nodejsRoot = path.resolve(__dirname, '../nodejs');


export default class CommandStart {
  private readonly positionArgs: string[];
  private readonly groupConfigPath: string;
  private readonly io: Io = new Io();


  constructor(positionArgs: string[]) {
    if (positionArgs.length !== 2) {
      throw new Error(`You should specify a group config path`);
    }

    this.positionArgs = positionArgs;
    this.groupConfigPath = positionArgs[0];
    this.groupConfigPath = positionArgs[1];
  }


  async start() {
    // TODO: resolve machine
    // TODO: resolve dev or prod

    const starter: Starter = new Starter('x86');

    // start()
    //   .catch((err) => {
    //     console.error(err);
    //   });

    /*
    "start":    "ts-node ./nodejs/start-x86-dev.ts",
    "x86-prod": "ts-node ./nodejs/start-x86-prod.ts",
    "rpi-dev":  "ts-node ./nodejs/start-rpi-dev.ts",
    "rpi-prod": "ts-node ./nodejs/start-rpi-prod.ts",
     */
  }

}
