import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoServer from '../../system/IoServer';
import IoSetSrc from '../ioSets/IoSetSrc';
import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {consoleError} from '../../system/lib/helpers';
import systemConfig from '../../system/config/systemConfig';


export default class StartIoServerStandalone {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private ioSet?: IoSet;


  constructor(
    configPath?: string,
    argForce?: boolean,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argForce,
      argMachine,
      argHostName,
      argWorkDir,
      argUser,
      argGroup,
    );
  }


  async init() {
    await this.groupConfig.init();
    await this.props.resolve();
    // load all the machine's io
    this.ioSet = await this.makeIoSet();

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

    // TODO: install like in dev mode
    //await this.installModules();

    const ioServer = new IoServer(
      // TODO: нужно переопределить параметры в systemCfg
      systemConfig,
      this.ioSet,
      this.shutdownRequestCb,
      console.info,
      consoleError
    );

    await ioServer.start();
  }

  private shutdownRequestCb = () => {
    console.warn(`WARNING: Restart isn't allowed in io-server standalone mode`);
  }

  private async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetSrc(this.os, this.props.envSetDir, this.props.platform, this.props.machine);

    ioSet.prepare && await ioSet.prepare();
    await ioSet.init();
    await this.configureStorage(ioSet);

    return ioSet;
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
