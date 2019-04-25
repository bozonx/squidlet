import RemoteIoBase from '../../system/ioSet/RemoteIoBase';
import IoSet from '../../system/interfaces/IoSet';
import System from '../../system/System';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import WsClient, {WsClientProps} from '../../shared/WsClient';


export default class IoSetWs extends RemoteIoBase implements IoSet {
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


  protected listen() {
    this.client.onError((err: string) => this.system.log.error(err));
    this.client.onIncomeMessage(this.resolveIncomeMessage);
  }

}
