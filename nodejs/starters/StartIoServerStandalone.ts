import IoServer from '../../system/ioServer/IoServer';
import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {consoleError} from '../../system/lib/helpers';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {omitObj} from '../../system/lib/objects';
import StartDevelopBase from './StartDevelopBase';


export default class StartIoServerStandalone extends StartDevelopBase {
  private ioSet?: IoSet;


  async init() {
    await super.init();

    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }

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


  async start() {
    await super.start();

    // load all the machine's io
    this.ioSet = await this.makeIoSet();

    // TODO: install like in dev mode
    //await this.installModules();

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

  protected async makeIoSet(): Promise<IoSet> {
    const ioSet: IoSet = new IoSetDevelopSrc(this.os, this.envBuilder);

    ioSet.prepare && await ioSet.prepare();
    ioSet.init && await ioSet.init();
    await this.configureStorage(ioSet);

    return ioSet;
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  protected resolveHostConfig(): PreHostConfig {
    return omitObj(
      this.props.hostConfig,
      'plugins',
      'devices',
      'drivers',
      'services',
      'devicesDefaults',
      'automation',
      'consoleLogger',
      'mqttApi',
      'wsApi',
      'httpApi',
      'dependencies',
    );
  }

  private async configureStorage(ioSet: IoSet) {
    if (typeof this.props.uid === 'undefined' && typeof this.props.gid === 'undefined') return;

    const ioItem = ioSet.getIo<StorageIo>('Storage');

    await ioItem.configure({
      uid: this.props.uid,
      gid: this.props.gid,
    });
  }

}
