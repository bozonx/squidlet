import Promised from '../Promised';
import Context from '../../Context';
import Sender from '../Sender';


type Timeout = NodeJS.Timeout;

interface ControlledIo {
  open: () => Promise<string>;
}

const DELAY_BETWEEN_TRIES_SEC = 3;
const CONNECTION_SENDER_ID = 'connection';


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
  private ioHandlerIndexes: number[] = [];
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
    // TODO: add
  }


  openNewConnection() {
    this.establishNewConnection();
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


  private establishNewConnection() {
    // if connection request is in progress - do nothing
    if (this.sender.isInProcess(CONNECTION_SENDER_ID)) return;

    if (this.openPromised.isFulfilled()) {
      this.openPromised = new Promised<void>();
    }

    this._isConnected = false;

    // const senderCb = async (): Promise<void> => {
    //   // TODO: send request
    // };

    this.sender.send(CONNECTION_SENDER_ID, this.makeConnectionTry)
      .catch(this.context.log.error);

    // TODO: слушать цикл переконнекта и реджектить промис
    // TODO: отписаться от старых события
    // TODO: сделать end старого connectionId
  }

  private makeConnectionTry = async (): Promise<void> => {
    this._connectionId = await this.controlledIo.open();
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
