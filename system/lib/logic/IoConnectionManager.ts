import Promised from '../Promised';
import Context from '../../Context';


type Timeout = NodeJS.Timeout;

interface ControlledIo {
  open: () => Promise<string>;
}

const DELAY_BETWEEN_TRIES_SEC = 3;


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
  private connectionTimeout?: Timeout;
  //private roundTimeout?: Timeout;


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
    // TODO: отписаться от старых события
    // TODO: сделать end старого connectionId
    // TODO: недопускать если уже идет соединение
    // TODO: почему connectionTimeoutSec меньше чем requestTimeoutSec
    // Timeout of one connection
    this.connectionTimeout = setTimeout(() => {
      // TODO: отменить текущее соединение
      // TODO: review
      setTimeout(() => this.establishNewConnection, DELAY_BETWEEN_TRIES_SEC * 1000);
    }, this.context.config.config.connectionTimeoutSec);


    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

    this._isConnected = false;

    this.makeConnectionTry()
      .catch(this.context.log.error);
  }

  private async makeConnectionTry() {
    // // Timeout of round of reconnection
    // this.roundTimeout = setTimeout(() => {
    //   clearTimeout(this.connectionTimeout as Timeout);
    //   this.openPromised.reject(new Error(`Timeout of connection`));
    //
    //   this.openPromised = new Promised<void>();
    //
    //   setTimeout(() => this.makeConnectionTry, DELAY_BETWEEN_TRIES_SEC * 1000);
    //   // TODO: подождать 5 сек
    //   // TODO: запустить заного все
    // }, this.context.config.config.requestTimeoutSec);

    let connectionId: string;

    try {
      connectionId = await this.controlledIo.open();
    }
    catch (e) {
      clearTimeout(this.connectionTimeout as Timeout);

      setTimeout(() => this.makeConnectionTry, DELAY_BETWEEN_TRIES_SEC * 1000);
      // TODO: запустить заного

      return;
    }

    clearTimeout(this.connectionTimeout as Timeout);
    //clearTimeout(this.roundTimeout as Timeout);

    this._connectionId = connectionId;
    this._isConnected = true;

    this.openPromised.resolve();
    // TODO: подписаться на события - listenIoEvents
  }

  private async removeIoListeners() {
    // remove old events if exist
    for (let handlerIndex of this.ioHandlerIndexes) {
      await this.mqttIo.removeListener(handlerIndex);
    }
  }

}
