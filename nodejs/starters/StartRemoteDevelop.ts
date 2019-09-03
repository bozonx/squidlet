import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartDevelopBase from './StartDevelopBase';
import SystemStarter from './SystemStarter';
import {IOSET_STRING_DELIMITER} from '../../shared/constants';


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
    // not pass user and group to not set it to IoSet
    // and not pass user and group to not set them to ioSet
    super(configPath, argForce, argLogLevel, 'noMachine', argHostName, argWorkDir, undefined, undefined);

    if (!argIoSet) throw new Error(`ioset param is required`);

    this.argIoSet = argIoSet;
  }

  async init() {
    // TODO: при instantiate EnvBuilder нужно указать платформу и машину удаленного хоста!!!
    // TODO: нужно запросить инфу с удаленного хоста
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

}
