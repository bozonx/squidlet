import Promised from '../Promised';
import Context from '../../Context';
import Sender from '../Sender';


interface ControlledIo {
  open: () => Promise<string>;
  close: (connectionId: string) => Promise<void>;
  removeListener: (handlerIndex: number) => Promise<void>;
}

export interface IoError extends Error {
  code: number;
  message: string;
}

const CONNECTION_SENDER_ID = 'IoCm.connection';
enum ERROR_CODES {
  connectionIdLost= 1001,
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
  private readonly sender: Sender;
  private openPromised = new Promised<void>();
  private listeners: ((connectionId: string) => Promise<number>)[] = [];
  private handlersIndexes: number[] = [];
  private _connectionId?: string;
  private _isConnected: boolean = false;


  constructor(context: Context, controlledIo: ControlledIo) {
    this.context = context;
    this.controlledIo = controlledIo;
    this.sender = new Sender(
      this.context.config.config.connectionTimeoutSec,
      this.context.config.config.senderResendTimeout,
      this.context.log.debug,
      this.context.log.warn
    );
  }

  async destroy() {
    try {
      await this.removeIoListeners();
    }
    catch (e) {
    }

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

  async registerListeners(listeners: ((connectionId: string) => Promise<number>)[]) {
    this.listeners = listeners;
  }

  handleConnect = () => {
    if (this.openPromised.isRejected()) {
      this.openPromised = new Promised<void>();
    }

    this.openPromised.resolve();

    this._isConnected = true;

    // TODO: остановить попытки переконнекта
  }

  handleDisconnect = () => {
    // reject open promise if it hasn't been fulfilled
    if (!this.openPromised.isFulfilled()) {
      this.openPromised.reject(new Error(`Mqtt: Disconnected ${this.connectionId}`));
    }
    // make new open promise
    this.openPromised = new Promised<void>();
    this._isConnected = false;

    // TODO: остановить попытки переконнекта (или начать заного)
  }

  async doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    if (!this.connectionId) throw new Error(`No connection id`);

    try {
      return await cb(this.connectionId);
    }
    catch (e) {
      if (!this.isLostConnectError(e)) throw e;

      // TODO: connect once and try again

      return await cb(this.connectionId);
    }
  }


  private async establishNewConnection(): Promise<void> {
    if (this.connectionId) {
      try {
        await this.removeIoListeners();
      }
      catch (e) {
        // error tolerant
        this.context.log.warn(e);
      }

      try {
        this.controlledIo.close(this.connectionId);
      }
      catch (e) {
        // error tolerant
        this.context.log.warn(e);
      }
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
    // TODO: что будет в случае ошибки?
    if (!this.connectionId) {
      throw new Error(`No connection id`);
    }

    for (let listener of this.listeners) {
      const handlerIndex: number = await listener(this.connectionId);

      this.handlersIndexes.push(handlerIndex);
    }
  }

  private async removeIoListeners() {
    const promises: Promise<void>[] = [];

    // remove old events if exist
    for (let handlerIndex of this.handlersIndexes) {
      promises.push(this.controlledIo.removeListener(handlerIndex));
    }

    return Promise.all(promises);
  }

  private isLostConnectError(e: Error | IoError) {
    if (typeof e === 'object' && 'code' in e) {
      return e.code === ERROR_CODES.connectionIdLost;
    }

    return Boolean(String(e).match(new RegExp(`code ${ERROR_CODES.connectionIdLost}`, 'i')));
  }

}
