import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartBase from './StartBase';
import {IOSET_STRING_DELIMITER} from '../../shared/constants';
import Platforms from '../../system/interfaces/Platforms';
import HostInfo from '../../system/interfaces/HostInfo';
import {compactUndefined} from '../../system/lib/arrays';
import HttpApiClient from '../../shared/HttpApiClient';


export default class StartRemoteDevelop extends StartBase {
  //private readonly argIoSet: string;
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
    this.httpApiClient = new HttpApiClient(console.log, this.host);
  }

  async init() {
    this.remoteHostInfo = await this.httpApiClient.callMethod('info') as any;

    await super.init();

    console.info(`Using remote ioset of host "${this.joinHostPort()}".`);

    if (!this.remoteHostInfo) return;

    console.info(`Remote machine: ${this.remoteHostInfo.machine}, ${this.remoteHostInfo.platform}`);
  }


  async start() {
    await super.start();

    // TODO: проверить тип хоста и переключить хост в режим ioServer если нужно

    const ioSet: IoSet = await this.makeIoSet();
    const systemStarter = new SystemStarter(this.os, this.props);

    await systemStarter.start(SYSTEM_DIR, ioSet);
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

  private parseIoSetString(ioSetString?: string): {host: string, port?: number} {
    if (!ioSetString) throw new Error(`IoSet host is required`);

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

  private joinHostPort(): string {
    return compactUndefined([this.host, this.port]).join(':');
  }

}
