import StartDevelop from '../nodejs/starters/StartDevelop';
import StartProd from '../nodejs/starters/StartProd';
import StartIoServerStandalone from '../nodejs/starters/StartIoServerStandalone';


interface CommandStartArgs {
  machine?: string;
  workDir?: string;
  name?: string;
  prod?: boolean;
  force?: boolean;
  user?: string;
  group?: string;
  ioset?: string;
}


export default class CommandStart {
  private readonly configPath: string;
  private readonly args: CommandStartArgs;


  constructor(positionArgs: string[], args: CommandStartArgs) {
    if (!positionArgs.length) {
      throw new Error(`You should specify a group config path`);
    }

    this.configPath = positionArgs[0];
    this.args = args;
  }


  async start() {
    // run prod is specified
    if (this.args.prod) {
      const starter = new StartProd(
        this.configPath,
        this.args.force,
        this.args.machine as any,
        this.args.name,
        this.args.workDir,
      );

      await starter.init();
      await starter.start();

      return;
    }

    // or run dev
    const starter = new StartDevelop(
      this.configPath,
      this.args.force,
      this.args.machine as any,
      this.args.name,
      this.args.workDir,
      this.args.ioset,
    );

    await starter.init();
    await starter.start();
  }

  /**
   * Start development io server on nodejs
   */
  async startIoServer() {
    const starter = new StartIoServerStandalone(
      this.configPath,
      this.args.force,
      this.args.machine as any,
      this.args.name,
      this.args.workDir,
      this.args.ioset,
    );

    await starter.init();
    await starter.start();
  }

}
