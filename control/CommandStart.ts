import Io from '../shared/Io';
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
    const starter: Starter = new Starter(
      this.configPath,
      this.args.machine,
      this.args.name,
      this.args.workDir
    );

    await starter.init();

    if (this.isProd) {
      await starter.startProd();
    }
    else {
      await starter.startDev();
    }
  }

}
