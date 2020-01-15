import Promised from '../Promised';
import Context from '../../Context';
import Sender from '../Sender';


interface ControlledIo {
  open: () => Promise<string>;
  removeListener: (handlerIndex: number) => Promise<void>;
}

const CONNECTION_SENDER_ID = 'IoCm.connection';


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
  private readonly sender: Sender;
  private openPromised = new Promised<void>();
  private listeners: (() => Promise<number>)[] = [];
  private handlersIndexes: number[] = [];
  private _connectionId?: string;
  private _isConnected: boolean = false;


  constructor(context: Context, controlledIo: ControlledIo) {
    this.context = context;
    this.controlledIo = controlledIo;
    this.sender = new Sender(
      this.context.config.config.requestTimeoutSec,
      this.context.config.config.senderResendTimeout,
      this.context.log.debug,
      this.context.log.warn
    );
  }

  async destroy() {
    await this.removeIoListeners();

    this.sender.destroy();
    this.openPromised.destroy();

    delete this.openPromised;
    delete this.listeners;
    delete this.handlersIndexes;
  }


  openNewConnection() {
    this.establishNewConnection()
      .catch(this.context.log.error);
  }

  async registerListeners(listeners: (() => Promise<number>)[]) {
    await this.removeIoListeners();

    this.listeners = listeners;
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


  private async establishNewConnection(): Promise<void> {
    if (this.connectionId) {
      // TODO: error tolerant
      await this.removeIoListeners();
      // TODO: сделать end старого connectionId
    }

    // if connection request is in progress - do nothing
    if (this.sender.isInProcess(CONNECTION_SENDER_ID)) return;

    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

    this._isConnected = false;

    try {
      this._connectionId = await this.sender.send(CONNECTION_SENDER_ID, () => this.controlledIo.open());
    }
    catch (e) {
      // it'll be called after whole cycle of reconnection
      this.context.log.error(e);

      if (!this.openPromised.isFulfilled()) {
        this.openPromised.reject(new Error(`ConnectionManager: can't connect`));
      }

      this.openPromised = new Promised<void>();

      // TODO: test that it'll be false on reconnect
      if (this.sender.isInProcess(CONNECTION_SENDER_ID)) {
        throw new Error(`Sender process hasn't been done`);
      }

      // start again
      this.establishNewConnection()
        .catch(this.context.log.error);

      return;
    }

    this._isConnected = true;

    this.openPromised.resolve();
    this.sendHandlers();
  }

  private async sendHandlers() {
    // TODO: если не получилось сделать за раз - то отписаться и попробовать заного???

    for (let listener of this.listeners) {
      const handlerIndex: number = await listener();

      this.handlersIndexes.push(handlerIndex);
    }
  }

  private async removeIoListeners() {
    // TODO: make error tolerant

    // remove old events if exist
    for (let handlerIndex of this.handlersIndexes) {
      await this.controlledIo.removeListener(handlerIndex);
    }
  }

}
