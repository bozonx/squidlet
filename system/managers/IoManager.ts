import IoSet from '../interfaces/IoSet';
import IoItem, {IoItemDefinition} from '../interfaces/IoItem';
import IoSetLocal from '../IoSetLocal';
import Context from '../Context';


export default class IoManager {
  private readonly context: Context;
  private readonly ioSet: IoSet;


  constructor(context: Context, ioSet?: IoSet) {
    this.context = context;
    this.ioSet = this.resolveIoSet(ioSet);
  }

  async init(): Promise<void> {
    await this.ioSet.init(this.context);
    await this.initAllIo();
    await this.configureAllIo();
  }

  async destroy() {
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    await this.ioSet.destroy();
  }


  getIo<T extends IoItem>(ioName: string): T {
    return this.ioSet.getIo<T>(ioName);
  }

  getNames(): string[] {
    return this.ioSet.getNames();
  }


  private async initAllIo() {
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.init) await ioItem.init();
    }
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

  private resolveIoSet(specifiedIoSet?: IoSet): IoSet {
    // use specified IO set if it is set
    if (specifiedIoSet) return specifiedIoSet;

    // use local IO set by default
    return new IoSetLocal();
  }

}
