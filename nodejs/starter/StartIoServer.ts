import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoServer from '../../system/IoServer';
import IoSetBase from './IoSetBase';
import IoSet from '../../system/interfaces/IoSet';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';


export default class StartIoServer {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


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

    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await this.os.mkdirP(this.props.varDataDir, { uid: this.props.uid, gid: this.props.gid });
    await this.os.mkdirP(this.props.envSetDir, { uid: this.props.uid, gid: this.props.gid });

    // TODO: install like in dev mode
    //await this.installModules();

    // load all the machine's io
    const ioSet: IoSet = await this.makeIoSet();
    const ioServer = new IoServer(
      ioSet,
      this.shutdownRequestCb,
      // this.props.hostConfig.ioServer,
      // (this.props.hostConfig.config && this.props.hostConfig.config.rcResponseTimoutSec)
      //   ? this.props.hostConfig.config.rcResponseTimoutSec
      //   : hostDefaultConfig.config.rcResponseTimoutSec,
      console.info,
      console.error
    );

    await ioServer.start();
  }

  private shutdownRequestCb = () => {
    console.warn(`WARNING: Restart isn't allowed in io-server standalone mode`);
  }

  // TODO: review
  private async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetBase(this.os, this.props.envSetDir, this.props.platform, this.props.machine);

    await ioSet.init();
    await this.configureStorage(ioSet);
    await this.configureIoSet(ioSet);

    return ioSet;
  }

  private async configureStorage(ioSet: IoSet) {
    if (typeof this.props.uid === 'undefined' || typeof this.props.gid === 'undefined') return;

    const ioItem = ioSet.getIo<StorageIo>('Storage');

    await ioItem.configure({
      uid: this.props.uid,
      gid: this.props.gid,
    });
  }

  private async configureIoSet(ioSet: IoSet) {
    if (!this.props.hostConfig.ios) return;

    for (let ioName of Object.keys(this.props.hostConfig.ios)) {
      const ioItem: IoItem = ioSet.getIo(ioName);

      ioItem.configure && await ioItem.configure(this.props.hostConfig.ios[ioName]);
    }
  }

}
