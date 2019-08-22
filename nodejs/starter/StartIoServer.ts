import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoServer from '../../shared/IoServer';
import IoSetBase from './IoSetBase';
import IoSet from '../../system/interfaces/IoSet';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';


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
    // TODO: не все их этого нужно
    await this.props.resolve();

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await this.os.mkdirP(this.props.varDataDir);
    await this.os.mkdirP(this.props.envSetDir);
    // TODO: install like in dev mode
    //await this.installModules();

    // load all the machine's io
    const ioSet = await this.makeIoSet();
    const ioServer = new IoServer(
      ioSet,
      this.props.hostConfig.ioServer,
      (this.props.hostConfig.config && this.props.hostConfig.config.rcResponseTimoutSec)
        ? this.props.hostConfig.config.rcResponseTimoutSec
        : hostDefaultConfig.config.rcResponseTimoutSec,
      console.info,
      console.error
    );

    await ioServer.init();
  }

  private async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetBase(this.os, this.props.envSetDir, this.props.platform, this.props.machine);

    await ioSet.init();

    return ioSet;
  }

}
