import IoSet from '../interfaces/IoSet';
import IoItem, {IoDefinitions} from '../interfaces/IoItem';
import Context from '../Context';
import systemConfig from '../systemConfig';


export default class IoManager {
  readonly ioSet: IoSet;

  private readonly context: Context;


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
    const ioDefinitions = await this.context.system.envSet.loadConfig<IoDefinitions>(
      systemConfig.fileNames.iosDefinitions
    );

    // configure ios that have a definition
    for (let ioName of Object.keys(ioDefinitions)) {
      // get io or throw an error
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      // do nothing if it doesn't have a configure() method
      if (!ioItem.configure) continue;

      this.context.log.debug(`IoManager: configure io "${ioName}" with ${JSON.stringify(ioDefinitions[ioName])}`);
      await ioItem.configure(ioDefinitions[ioName]);
    }
  }

}
