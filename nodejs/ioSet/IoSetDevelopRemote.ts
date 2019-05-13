import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, IOSET_STRING_DELIMITER} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import System from '../../system';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import RemoteIoBase from './RemoteIoBase';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';


export default class IoSetNodejsDevelopLocal extends RemoteIoBase implements IoSet {
  private readonly os: Os;
  private wsClientProps: WsClientProps;
  private _client?: WsClient;
  private get client(): WsClient {
    return this._client as any;
  }


  private readonly envBuilder: EnvBuilder;
  private readonly paramsString: string;

  constructor(os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string, paramsString?: string) {
    this.os = os;
    this.envBuilder = envBuilder;
    this.paramsString = paramsString;
  }

  // constructor(wsClientProps: WsClientProps) {
  //   super();
  //   this.wsClientProps = wsClientProps;
  // }

  async init(system: System): Promise<void> {
    await super.init(system);

    this._client = new WsClient(this.system.host.id, this.wsClientProps);

    this.listen();

    delete this.wsClientProps;
  }


  protected async send(message: RemoteCallMessage): Promise<void> {
    return this.client.send(message);
  }


  async destroy() {
    await super.destroy();
    await this.client.destroy();
  }


  private listen() {
    this.client.onError((err: string) => this.system.log.error(err));
    this.client.onIncomeMessage(this.resolveIncomeMessage);
  }


  private async configureEnvSet() {

    // TODO review

    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`===> generate hosts env files and configs`);

    await envBuilder.collect();

    console.info(`===> generate master config object`);

    const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();

    console.info(`===> initializing system`);

    //EnvSetMemory.$registerConfigSet(hostEnvSet);
  }

  private parseIoSetString(ioSetString?: string): {host: string, port?: number} | undefined {
    if (!ioSetString) return;

    const splat = ioSetString.split(IOSET_STRING_DELIMITER);

    return {
      host: splat[0],
      port: splat[1] && parseInt(splat[1]) || undefined,
    };
  }

}
