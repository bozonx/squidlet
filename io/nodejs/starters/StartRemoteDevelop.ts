import IoSet from '../../../system/interfaces/IoSet';
import LogLevel from '../../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartBase from './StartBase';
import {IOSET_STRING_DELIMITER} from '../../../shared/constants';
import Platforms from '../../../system/interfaces/Platforms';
import HostInfo from '../../../system/interfaces/HostInfo';
import HttpApiClient from '../../../shared/helpers/HttpApiClient';
import Main from '../../../system/Main';
import Sender from '../../../system/lib/Sender';
import {WAIT_RESPONSE_TIMEOUT_SEC} from '../../../system/constants';
import ConsoleLoggerColorful from '../../../shared/helpers/ConsoleLoggerColorful';


const SENDER_RESEND_INTERVAL_SEC = 1;
const SENDER_REPEATS = 10;
const SENDER_REPEATS_INTERVAL_SEC = 2;


export default class StartRemoteDevelop extends StartBase {
  protected buildRoot = 'remote';
  protected lockAppSwitch = true;

  private remoteHostInfo?: HostInfo;
  private readonly host: string;
  private readonly port?: number;
  private readonly httpApiClient: HttpApiClient;
  private readonly sender: Sender;


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
    this.sender = new Sender(
      WAIT_RESPONSE_TIMEOUT_SEC,
      SENDER_RESEND_INTERVAL_SEC,
      console.log,
      console.warn
    );
  }

  async init() {
    this.remoteHostInfo = await this.switchAppAndGetInfo();

    await super.init();

    if (!this.remoteHostInfo) throw new Error(`no remoteHostInfo`);

    console.info(`Using remote ioset of host "${this.httpApiClient.hostPort}".`);
    console.info(`Remote machine: ${this.remoteHostInfo.machine}, ${this.remoteHostInfo.platform}`);
  }


  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();
    const logger = new ConsoleLoggerColorful(this.starterProps.logLevel);

    this.main = new Main(ioSet, logger, undefined, false, this.lockAppSwitch);

    console.info(`===> Starting app`);

    await this.main.init();
    await this.main.start();
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

    for (let i = 0; i < SENDER_REPEATS; i++) {
      let result: HostInfo | undefined;

      await new Promise<void>((resolve, reject) => {
        //if (i >= SENDER_REPEATS -1)
        setTimeout(() => {
          this.sender.send<HostInfo>('info', this.httpApiClient.callMethod('info') as any)
            .then((hostInfo: HostInfo) => {
              // just end cycle if app hasn't been switched
              if (hostInfo.appType === 'ioServer') return resolve();

              result = hostInfo;

              resolve();
            })
            .catch((e) => resolve);
        }, SENDER_REPEATS_INTERVAL_SEC * 1000);
      });
      // exit cycle if there is a result
      if (result) return result;

      console.info(`App hasn't been switched, try again`);
    }

    throw new Error(`App hasn't been switched during timeout`);
  }

}
