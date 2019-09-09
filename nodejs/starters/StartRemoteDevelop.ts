import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartDevelopBase from './StartDevelopBase';
import SystemStarter from './SystemStarter';
import {IOSET_STRING_DELIMITER} from '../../shared/constants';
import Platforms from '../../system/interfaces/Platforms';
import HostInfo from '../../system/interfaces/HostInfo';
import {HttpClientIo} from '../../system/interfaces/io/HttpClientIo';
import HttpClient from '../ios/HttpClient';
import {compactUndefined} from '../../system/lib/arrays';
import {HttpResponse} from '../../system/interfaces/Http';


const httpClientIo: HttpClientIo = new HttpClient();


export default class StartRemoteDevelop extends StartDevelopBase {
  //private readonly argIoSet: string;
  private remoteHostInfo?: HostInfo;
  private readonly host: string;
  private readonly port?: number;


  constructor(
    configPath: string,
    argLogLevel?: LogLevel,
    argHostName?: string,
    argIoSet?: string,
  ) {
    // not pass user and group to not set it to IoSet
    // and not pass user and group to not set them to ioSet
    super(configPath, undefined, argLogLevel, 'noMachine', argHostName);

    if (!argIoSet) throw new Error(`ioset param is required`);

    const {host, port} = this.parseIoSetString(argIoSet);

    this.host = host;
    this.port = port;
  }

  async init() {
    this.remoteHostInfo = await this.info();
    await super.init();

    console.info(`Using remote ioset of host "${this.joinHostPort()}"`);
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
    if (!this.remoteHostInfo) throw new  Error(`No remote host info`);


    const ioSet = new IoSetDevelopRemote(
      this.os,
      this.envBuilder,
      this.remoteHostInfo.usedIo,
      this.host,
      this.port
    );

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

  private parseIoSetString(ioSetString?: string): {host: string, port?: number} {
    if (!ioSetString) throw new Error(`Host is required`);

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

  private async info(): Promise<HostInfo> {
    // TODO: use HttpClientLogic
    // TODO: how to switch protocol???
    const url = `http://${this.joinHostPort()}/api/info`;
    const result: HttpResponse = await httpClientIo.fetch({
      method: 'get',
      url,
      // TODO: remove
      headers: {},
    });
    // TODO: ask ioServer via http api for platform and machine
    // TODO: set result
    return {
      hostType: 'ioServer',
      platform: 'nodejs',
      machine: 'rpi',
      usedIo: [],
    };
  }

  private joinHostPort(): string {
    return compactUndefined([this.host, this.port]).join(':');
  }

}
