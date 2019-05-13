import StartDevelop from '../nodejs/starter/StartDevelop';
import StartProd from '../nodejs/starter/StartProd';


interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  prod?: boolean;
  ioset?: string;
}


export default class CommandStart {
  private readonly configPath: string;
  private readonly args: CommandStartArgs;
  private readonly isProd: boolean;


  constructor(positionArgs: string[], args: CommandStartArgs) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.configPath = positionArgs[0];
    this.args = args;
    this.isProd = Boolean(args.prod);
  }


  async start() {
    // run prod is specified
    if (this.isProd) {
      const starter: StartProd = new StartProd(
        this.configPath,
        this.args.machine as any,
        this.args.name,
        this.args.workDir,
      );

      await starter.init();
      await starter.start();

      return;
    }

    // or run dev
    const starter: StartDevelop = new StartDevelop(
      this.configPath,
      this.args.machine as any,
      this.args.name,
      this.args.workDir,
      this.args.ioset,
    );

    await starter.init();
    await starter.start();
  }

}
