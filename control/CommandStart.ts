import Io from '../shared/Io';


export default class CommandStart {
  private readonly positionArgs: string[];
  private readonly io: Io = new Io();


  constructor(positionArgs: string[]) {
    this.positionArgs = positionArgs;
  }

}
