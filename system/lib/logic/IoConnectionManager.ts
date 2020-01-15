import Promised from '../Promised';
import Context from '../../Context';


interface ControlledIo {
  open: () => Promise<string>;
}


export default class IoConnectionManager {
  /**
   * It represents that it has connectionId and IO is connected to broker.
   * On disconnect it will be recreated.
   */
  get connectedPromise(): Promise<void> {
    return this.openPromised.promise;
  }

  get connectionId(): string | undefined {
    return this._connectionId;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  private readonly context: Context;
  private readonly controlledIo: ControlledIo;
  private openPromised = new Promised<void>();
  private ioHandlerIndexes: number[] = [];
  private _connectionId?: string;
  private _isConnected: boolean = false;


  constructor(context: Context, controlledIo: ControlledIo) {
    this.context = context;
    this.controlledIo = controlledIo;
  }

  async destroy() {
    await this.removeIoListeners();
    // TODO: add
  }


  openNewConnection() {
    this.establishNewConnection()
      .catch(this.context.log.error);
  }

  async registerListeners(listeners: (() => Promise<number>)[]) {

    // TODO: если не получилось сделать за раз - то отписаться и попробовать заного???

    await this.removeIoListeners();

  }

  handleConnect = () => {
    // TODO: таймаут если не удалось соединиться за 60 сек - переконекчиваться
    //  - возможно это уже реализованно в самам mqtt
    //  - бесконечный цикл переконекта при первом подсоединении и при последующих обрывах связи
    this.openPromised.resolve();
  }

  handleDisconnect = () => {
    // reject open promise if it hasn't been fulfilled
    if (!this.openPromised.isFulfilled()) {
      this.openPromised.reject(new Error(`Mqtt: Disconnected ${connectionId}`));
    }
    // make new open promise
    this.openPromised = new Promised<void>();
    this._isConnected = false;


    // TODO: what to do next ????
  }

  doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    // TODO: лучше переподписаться на события заного, отписаться от старых
    // TODO: см code 1001 и делать переконнект если указанно
  }


  private async establishNewConnection() {
    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

    this._isConnected = false;

    // Timeout of one connection
    const connectionTimeout = setTimeout(() => {
      // TODO: подождать 3 сек
      // TODO: запустить заного
    }, this.context.config.config.connectionTimeoutSec);

    // Timeout of round of reconnection
    const roundTimeout = setTimeout(() => {
      clearTimeout(connectionTimeout);
      this.openPromised.reject(new Error(`Timeout of connection`));

      this.openPromised = new Promised<void>();

      // TODO: подождать 5 сек
      // TODO: запустить заного все
    }, this.context.config.config.requestTimeoutSec);

    this.controlledIo.open()
      .then((connectionId: string) => {
        clearTimeout(connectionTimeout);
        clearTimeout(roundTimeout);

        this._connectionId = connectionId;
        this._isConnected = true;

        this.openPromised.resolve();
        // TODO: подписаться на события - listenIoEvents
      })
      .catch(() => {
        clearTimeout(connectionTimeout);

        // TODO: запустить заного
      });
  }

  private async removeIoListeners() {
    // remove old events if exist
    for (let handlerIndex of this.ioHandlerIndexes) {
      await this.mqttIo.removeListener(handlerIndex);
    }
  }

}
