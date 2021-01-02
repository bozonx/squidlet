import IoSet from '../interfaces/IoSet';
import IoItem, {IoDefinitions} from '../interfaces/IoItem';
import Context from '../Context';
import systemConfig from '../systemConfig';
import Logger from '../../../../squidlet-networking/src/interfaces/Logger';


export default class IoManager {
  readonly ioSet: IoSet;

  get log(): Logger {
    return this.context.log;
  }

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

    // init ios that have a definition
    for (let ioName of this.ioSet.getNames()) {
      // get platforms or throw an error
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.configure && ioDefinitions[ioName]) {
        this.context.log.debug(`IoManager: configure io "${ioName}" with ${JSON.stringify(ioDefinitions[ioName])}`);
        await ioItem.configure(ioDefinitions[ioName]);
      }

      if (ioItem.init) {
        this.context.log.debug(`IoManager: initialize io "${ioName}"`);

        // TODO: make IoContext
        await ioItem.init(this);
      }
    }
  }

}
