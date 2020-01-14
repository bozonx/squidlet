import Promised from './Promised';
import Context from '../Context';


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

  private readonly context: Context;
  private readonly controlledIo: ControlledIo;
  private openPromised = new Promised<void>();
  private ioHandlerIndexes: number[] = [];
  connectionId?: string;


  constructor(context: Context, controlledIo: ControlledIo) {
    this.context = context;
    this.controlledIo = controlledIo;
  }

  async destroy() {
    await this.removeIoListeners();
    // TODO: add
  }


  isConnected(): Promise<boolean> {
    // TODO: add
  }

  openNewConnection() {
    this.establishConnection()
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

    // TODO: what to do next ????
  }

  doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    // TODO: лучше переподписаться на события заного, отписаться от старых
    // TODO: см code 1001 и делать переконнект если указанно
  }


  private async establishConnection() {
    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

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

        this.connectionId = connectionId;

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
