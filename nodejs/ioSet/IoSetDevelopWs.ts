import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import System from '../../system';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import RemoteIoBase from '../../system/ioSet/RemoteIoBase';


export default class IoSetNodejsDevelopLocal extends RemoteIoBase implements IoSet {
  private wsClientProps: WsClientProps;
  private _client?: WsClient;
  private get client(): WsClient {
    return this._client as any;
  }


  constructor(wsClientProps: WsClientProps) {
    super();
    this.wsClientProps = wsClientProps;
  }

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

}
