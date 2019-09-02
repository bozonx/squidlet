import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartDevelopBase from './StartDevelopBase';
import SystemStarter from './SystemStarter';


export default class StartRemoteDevelop extends StartDevelopBase {
  private readonly argIoSet: string;


  constructor(
    configPath: string,
    argForce?: boolean,
    argLogLevel?: LogLevel,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
    argIoSet?: string,
  ) {
    super(configPath, argForce, argLogLevel, argMachine, argHostName, argWorkDir, argUser, argGroup);

    if (!argIoSet) throw new Error(`ioset param is required`);

    this.argIoSet = argIoSet;
  }

  async init() {
    await super.init();

    console.info(`Using remote ioset of host "${this.argIoSet}"`);
  }


  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();
    const systemStarter = new SystemStarter(this.os, this.props);

    await systemStarter.start(SYSTEM_DIR, ioSet);
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  protected async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetDevelopRemote(
      this.os,
      // TODO: не передавать
      this.envBuilder,
      this.props.platform,
      this.props.machine,
      this.argIoSet
    );

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

}
