import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartDevelopBase from './StartDevelopBase';
import SystemStarter from './SystemStarter';
import {IOSET_STRING_DELIMITER} from '../../shared/constants';
import Platforms from '../../system/interfaces/Platforms';
import HostInfo from '../../system/interfaces/HostInfo';


export default class StartRemoteDevelop extends StartDevelopBase {
  private readonly argIoSet: string;
  private remoteHostInfo?: HostInfo;


  constructor(
    configPath: string,
    // TODO: remove
    argForce?: boolean,
    argLogLevel?: LogLevel,
    // TODO: remove
    argMachine?: NodejsMachines,
    // TODO: remove ????
    argHostName?: string,
    // TODO: remove
    argWorkDir?: string,
    // TODO: remove
    argUser?: string,
    // TODO: remove
    argGroup?: string,
    argIoSet?: string,
  ) {
    // not pass user and group to not set it to IoSet
    // and not pass user and group to not set them to ioSet
    super(configPath, argForce, argLogLevel, 'noMachine', argHostName, argWorkDir, undefined, undefined);

    if (!argIoSet) throw new Error(`ioset param is required`);

    this.argIoSet = argIoSet;
  }

  async init() {
    this.remoteHostInfo = await this.getHostInfo();
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
    const {host, port} = this.parseIoSetString(this.argIoSet);

    const ioSet = new IoSetDevelopRemote(this.os, this.envBuilder, host, port);

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

  private parseIoSetString(ioSetString?: string): {host?: string, port?: number} {
    if (!ioSetString) return {};

    const splat = ioSetString.split(IOSET_STRING_DELIMITER);

    return {
      host: splat[0],
      port: splat[1] && parseInt(splat[1]) || undefined,
    };
  }

  protected resolvePlatformMachine(): {platform: Platforms, machine: string} {
    if (!this.remoteHostInfo) throw new  Error(`No remote host info`);

    return {
      platform: this.remoteHostInfo.platform,
      machine: this.remoteHostInfo.machine,
    };
  }

  private async getHostInfo(): Promise<HostInfo> {
    // TODO: ask ioServer via http api for platform and machine
    return {
      platform: 'nodejs',
      machine: 'rpi',
      usedIo: [],
    };
  }

}
