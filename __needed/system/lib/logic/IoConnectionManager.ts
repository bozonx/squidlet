import Promised from '../../../../../squidlet-lib/src/Promised';
import Context from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import Sender from '../../../../../squidlet-lib/src/Sender';
import {CError} from '../../../../../squidlet-lib/src/CError';


interface ControlledIo {
  open: () => Promise<string>;
  close: (connectionId: string) => Promise<void>;
  removeListener: (connectionId: string, handlerIndex: number) => Promise<void>;
}

const CONNECTION_SENDER_ID = 'IoCm.connection';
enum ERROR_CODES {
  connectionIdLost = 1001,
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
    return this.openPromised.isResolved();
  }

  get isConnecting(): boolean {
    return this.sender.isInProcess(CONNECTION_SENDER_ID);
  }


  private readonly context: Context;
  private readonly controlledIo: ControlledIo;
  private readonly sender: Sender;
  private openPromised = new Promised<void>();
  private listeners: ((connectionId: string) => Promise<number>)[] = [];
  private handlersIndexes: number[] = [];
  private _connectionId?: string;


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

  registerListeners(listeners: ((connectionId: string) => Promise<number>)[]) {
    this.listeners = listeners;
  }

  handleConnect = () => {
    if (this.openPromised.isRejected()) {
      this.openPromised = new Promised<void>();
    }

    this.openPromised.resolve();

    // TODO: остановить попытки переконнекта
  }

  handleDisconnect = () => {
    // reject open promise if it hasn't been fulfilled
    if (!this.openPromised.isFulfilled()) {
      this.openPromised.reject(new Error(`Mqtt: Disconnected ${this.connectionId}`));
    }
    // make new open promise
    this.openPromised = new Promised<void>();

    // TODO: остановить попытки переконнекта (или начать заного)
  }

  handleClose = () => {
    // TODO: add
    // TODO: remove old events
    // this.listenIoEvents()
    //   .catch(this.log.error);
  }

  async doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    if (!this.connectionId) throw new Error(`No connection id`);

    try {
      return await cb(this.connectionId);
    }
    catch (e) {
      if (!this.isLostConnectError(e)) throw e;

      if (this.isConnecting) {
        // if there is a connection tries - wait for 20 sec while connection is established
        await this.connectedPromise;
      }
      else if (!this.isConnected) {
        this._connectionId = await this.sender.send(CONNECTION_SENDER_ID, () => this.controlledIo.open());

        this.handleConnectionSuccess();
      }
      // if connection is established just do request
      return cb(this.connectionId);
    }
  }


  private async establishNewConnection(): Promise<void> {
    // if connection request is in progress - do nothing
    if (this.isConnecting) return;

    await this.finishOldConnection();

    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

    try {
      // try to send during 20 seconds
      this._connectionId = await this.sender.send(CONNECTION_SENDER_ID, () => this.controlledIo.open());
    }
    catch (e) {
      // it'll be called after whole cycle of reconnection
      this.context.log.error(e);
      this.handleConnectionTryFail();

      return;
    }

    this.handleConnectionSuccess();
  }

  private handleConnectionSuccess() {
    this.openPromised.resolve();
    // TODO: review - если не получилось подписаться
    this.sendHandlers()
      .catch(this.context.log.error);
  }

  private handleConnectionTryFail() {
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
    if (!this.connectionId) return;

    const promises: Promise<void>[] = [];

    // remove old events if exist
    for (let handlerIndex of this.handlersIndexes) {
      promises.push(this.controlledIo.removeListener(this.connectionId, handlerIndex));
    }

    return Promise.all(promises);
  }

  private isLostConnectError(e: Error | CError) {
    if (typeof e === 'object' && 'code' in e) {
      return e.code === ERROR_CODES.connectionIdLost;
    }

    return Boolean(String(e).match(new RegExp(`code ${ERROR_CODES.connectionIdLost}`, 'i')));
  }

  private async finishOldConnection() {
    if (!this.connectionId) return;

    try {
      await this.removeIoListeners();
    }
    catch (e) {
      // error tolerant
      this.context.log.warn(e);
    }

    try {
      await this.controlledIo.close(this.connectionId);
    }
    catch (e) {
      // error tolerant
      this.context.log.warn(e);
    }
  }

}
