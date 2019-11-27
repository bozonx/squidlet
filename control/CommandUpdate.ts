import * as path from 'path';

import Os from '../shared/Os';


interface UpdateCommandParams {
  groupConfigPath: string;
  hostName?: string;
}


export default class CommandUpdate {
  private readonly positionArgs: string[];
  private readonly os: Os = new Os();


  constructor(positionArgs: string[], args: {[index: string]: any}) {
    this.positionArgs = positionArgs;
  }


  async start() {

  }


  private resolveParams(): UpdateCommandParams {
    // specified only config group path
    if (this.positionArgs[0] && !this.positionArgs[1]) {
      return {
        groupConfigPath: this.positionArgs[0],
      };
    }
    // specified host name and group config
    else if (this.positionArgs[0] && this.positionArgs[1]) {
      return {
        hostName: this.positionArgs[0],
        groupConfigPath: this.positionArgs[1],
      };
    }

    throw new Error(`You should specify a group config path`);
  }

}
