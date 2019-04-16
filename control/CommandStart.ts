import Starter from '../nodejs/starter/Starter';


interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  prod?: boolean;
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
    const starter: Starter = new Starter(
      this.configPath,
      this.args.machine,
      this.args.name,
      this.args.workDir
    );

    await starter.init();

    // run prod is specified
    if (this.isProd) return starter.startProd();
    // or run dev
    return starter.startDev();
  }

}
