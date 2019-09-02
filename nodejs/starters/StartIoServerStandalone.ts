import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoServer from '../../system/IoServer';
import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {consoleError} from '../../system/lib/helpers';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {omitObj} from '../../system/lib/objects';
import LogLevel from '../../system/interfaces/LogLevel';
import StartDevelopBase from './StartDevelopBase';


export default class StartIoServerStandalone extends StartDevelopBase {
  private ioSet?: IoSet;


  async init() {
    // TODO: заменить host config в EnvBuilder
    await super.init();

    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }

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
    if (!this.ioSet) throw new Error(`No IoSet`);

    await this.os.mkdirP(this.props.varDataDir, { uid: this.props.uid, gid: this.props.gid });
    await this.os.mkdirP(this.props.envSetDir, { uid: this.props.uid, gid: this.props.gid });

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

  private async makeIoSet(): Promise<IoSet> {
    const envBuilder = new EnvBuilder(
      this.preparePreHostConfig(),
      this.props.envSetDir,
      this.props.tmpDir,
      this.props.platform,
      this.props.machine,
      { uid: this.props.uid, gid: this.props.gid }
    );
    //const ioSet = new IoSetStandaloneIoServer(this.os, this.props.hostConfig, this.props.platform, this.props.machine);

    await envBuilder.collect();

    const ioSet: IoSet = new IoSetDevelopSrc(
      this.os,
      envBuilder,
      this.props.platform,
      this.props.machine
    );

    ioSet.prepare && await ioSet.prepare();
    ioSet.init && await ioSet.init();
    await this.configureStorage(ioSet);

    return ioSet;
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  private preparePreHostConfig(): PreHostConfig {
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
