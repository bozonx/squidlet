import IoServer from '../../system/ioServer/IoServer';
import {consoleError} from '../../system/lib/helpers';
import IoSet from '../../system/interfaces/IoSet';
import IoSetBuiltin from '../../squidletLight/IoSetBuiltin';
import IoItem from '../../system/interfaces/IoItem';


export class IoServerStandaloneBuilder {
  private ioSet?: IoSet;


  // TODO: review
  async destroy() {
    if (!this.ioSet) throw new Error(`No IoSet`);

    // destroy of ios
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    // destroy of ioSet
    await this.ioSet.destroy();
  }


  async build() {
    // load all the machine's io
    this.ioSet = await this.makeIoSet();

    const ioServer = new IoServer(
      this.ioSet,
      this.shutdownRequestCb,
      console.log,
      console.info,
      consoleError
    );

    await ioServer.start();
  }


  private shutdownRequestCb = () => {
    console.warn(`WARNING: Restart isn't allowed in io-server standalone mode`);
  }

  private async makeIoSet(): Promise<IoSet> {
    const ioSet: IoSet = new IoSetBuiltin();

    //ioSet.prepare && await ioSet.prepare();
    ioSet.init && await ioSet.init();

    return ioSet;
  }

}
