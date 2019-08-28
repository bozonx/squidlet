import IoSet from '../interfaces/IoSet';
import IoItem, {IoItemDefinition} from '../interfaces/IoItem';
import Context from '../Context';


export default class IoManager {
  private readonly context: Context;
  private readonly ioSet: IoSet;


  constructor(context: Context, ioSet: IoSet) {
    this.context = context;
    this.ioSet = ioSet;
  }

  async init(): Promise<void> {
    await this.configureAllIo();
  }


  getIo<T extends IoItem>(ioName: string): T {
    return this.ioSet.getIo<T>(ioName);
  }

  getNames(): string[] {
    return this.ioSet.getNames();
  }


  private async configureAllIo() {
    const ioNames: string[] = this.ioSet.getNames();
    const ioParams = await this.context.system.envSet.loadConfig<IoItemDefinition>(
      this.context.system.initializationConfig.fileNames.iosDefinitions
    );

    // configure ios if need
    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (!ioItem) {
        this.context.log.warn(`ioDefinitions config has definition of io item which doesn't exist in ioSet`);

        continue;
      }
      else if (!ioParams[ioName] || !ioItem || !ioItem.configure) {
        continue;
      }

      await ioItem.configure(ioParams[ioName]);
    }
  }

}
