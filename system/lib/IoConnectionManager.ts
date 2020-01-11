import Promised from './Promised';
import Context from '../Context';


interface ControlledIo {
  open: () => string;
}


export default class IoConnectionManager {
  /**
   * It represents that it has connectionId and IO is connected to broker.
   * On disconnect it will be recreated.
   */
  get connectedPromise(): Promise<void> {
    return this.openPromised.promise;
  }

  private readonly context: Context;
  private openPromised = new Promised<void>();
  private ioHandlerIndexes: number[] = [];
  connectionId?: string;


  constructor(context: Context, controlledIo: ControlledIo) {
    this.context = context;
  }


  openNewConnection() {
    //this.openPromise = new Promised<void>();

    this.log.info(`... Connecting to MQTT broker: ${this.props.url}`);

    // TODO: если не удалось подключиться?
    this.listenIoEvents()
      .catch(this.log.error);

    // TODO: если не удалось подписаться то продолжать это делать через несколько секунд
    this.establishConnection()
      .catch(this.log.error);
  }

  doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    // TODO: лучше переподписаться на события заного, отписаться от старых
    // TODO: см code 1001 и делать переконнект если указанно
  }

  private async establishConnection() {

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omitObj(this.props, 'url')
    );
  }

}
