import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartBase from './StartBase';
import {IOSET_STRING_DELIMITER} from '../../shared/constants';
import Platforms from '../../system/interfaces/Platforms';
import HostInfo from '../../system/interfaces/HostInfo';
import HttpApiClient from '../../shared/HttpApiClient';
import SolidStarter from '../../system/SolidStarter';


export default class StartRemoteDevelop extends StartBase {
  private remoteHostInfo?: HostInfo;
  private readonly host: string;
  private readonly port?: number;
  private readonly httpApiClient: HttpApiClient;


  constructor(configPath: string, logLevel?: LogLevel, hostName?: string, argIoSet?: string) {
    super(configPath, {
      logLevel,
      machine: 'noMachine',
      hostName,
    });

    if (!argIoSet) throw new Error(`--ioset param is required`);

    const {host, port} = this.parseIoSetString(argIoSet);

    this.host = host;
    this.port = port;
    this.httpApiClient = new HttpApiClient(console.log, this.host, this.port);
  }

  async init() {
    this.remoteHostInfo = await this.switchAppAndGetInfo();

    // TODO: appWorkDir, следовательно appEnvSetDir - должен быть в build dir и вообще он не нужен

    await super.init();

    if (!this.remoteHostInfo) throw new Error(`no remoteHostInfo`);

    console.info(`Using remote ioset of host "${this.httpApiClient.hostPort}".`);
    console.info(`Remote machine: ${this.remoteHostInfo.machine}, ${this.remoteHostInfo.platform}`);
  }


  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();



    //this.starter = await this.startSolid(SolidStarter, ioSet);

    // const systemStarter = new SystemStarter(this.os, this.props);
    //
    // await systemStarter.start(SYSTEM_DIR, ioSet);
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  protected async makeIoSet(): Promise<IoSet> {
    if (!this.remoteHostInfo) throw new  Error(`No remote host info`);

    const ioSet = new IoSetDevelopRemote(
      this.os,
      this.envBuilder,
      this.remoteHostInfo.usedIo,
      this.host,
      this.port
    );

    return ioSet;
  }

  protected resolvePlatformMachine(): {platform: Platforms, machine: string} {
    if (!this.remoteHostInfo) throw new  Error(`No remote host info`);

    return {
      platform: this.remoteHostInfo.platform,
      machine: this.remoteHostInfo.machine,
    };
  }


  private parseIoSetString(ioSetString?: string): {host: string, port?: number} {
    if (!ioSetString) throw new Error(`IoSet host is required`);

    const splat = ioSetString.split(IOSET_STRING_DELIMITER);

    return {
      host: splat[0],
      port: splat[1] && parseInt(splat[1]) || undefined,
    };
  }

  private async switchAppAndGetInfo(): Promise<HostInfo> {
    const info: HostInfo = await this.httpApiClient.callMethod('info') as any;

    if (info.appType === 'ioServer') return info;

    await this.httpApiClient.callMethod('switchToIoServer');

    const ioServerInfo: HostInfo = await this.httpApiClient.callMethod('info') as any;

    // TODO: call during 60 sec

    return ioServerInfo;
  }

}
