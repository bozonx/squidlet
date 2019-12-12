import PigpioWrapper, {PigpioInfo, PigpioOptions} from './PigpioWrapper';
import Promised from '../../system/lib/Promised';
import {compactUndefined} from '../../system/lib/arrays';
import Logger from '../../system/interfaces/Logger';

const pigpioClient = require('pigpio-client');


interface Client {
  gpio(pin: number): any;
  end(cb?: () => void): void;
  on(eventName: string, cb: (...p: any[]) => void): void;
  once(eventName: string, cb: (...p: any[]) => void): void;
  removeListener(eventName: string, cb: (...p: any[]) => void): void;
}

const RECONNECT_TIMEOUT_SEC = 20;
const DEFAULT_OPTIONS = {
  host: 'localhost',
};
let instance: PigpioClient | undefined;


export class PigpioClient {
  get inited(): boolean {
    return this.hasBeenInited;
  }

  get connected(): boolean {
    return this.connectionPromised.isResolved();
  }

  get connectionPromise(): Promise<void> {
    return this.connectionPromised.promise;
  }

  private logger: Logger;
  private clientOptions: PigpioOptions = DEFAULT_OPTIONS;
  private client?: Client;
  private connectionPromised = new Promised<void>();
  private hasBeenInited: boolean = false;
  // timeout to wait between trying of connect
  private connectionTimeout?: NodeJS.Timeout;
  private readonly pinInstances: {[index: string]: PigpioWrapper} = {};


  constructor(logger: Logger) {
    this.logger = logger;
  }


  init(clientOptions: PigpioOptions): void{
    if (this.inited) {
      this.logger.warn(`PigpioClient: Disallowed to init more then one time`);

      return;
    }

    this.clientOptions = {
      ...this.clientOptions,
      ...clientOptions,
      // do not use timeout. Because client's reconnect works weirdly.
      timeout: 0,
    };

    this.hasBeenInited = true;

    this.connect();
  }

  async destroy(): Promise<void> {
    this.clearListeners();
    this.connectionPromised.destroy();

    delete this.connectionPromised;

    this.client && this.client.end();

    delete this.client;
  }


  isPinInitialized(pin: number): boolean {
    return Boolean(this.pinInstances[pin]);
  }

  getPinInstance(pin: number): PigpioWrapper | undefined {
    return this.pinInstances[pin];
  }

  makePinInstance(pin: number) {
    if (this.pinInstances[pin]) {
      throw new Error(`PigpioClient: pin has been already instantiated`);
    }

    if (!this.client) {
      throw new Error(`PigpioClient: Client hasn't been connected`);
    }

    this.pinInstances[pin] = new PigpioWrapper(this.client.gpio(pin));
  }

  clearPin(pin: number) {
    this.pinInstances[pin].destroy();

    delete this.pinInstances[pin];
  }

  getInstantiatedPinList(): string[] {
    return Object.keys(this.pinInstances);
  }


  /**
   * It rises once on client has been connected.
   */
  private handleConnected = (info: PigpioInfo): void => {
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

    this.logger.info(
      `PigpioClient has been connected successfully to the pigpio daemon ` +
      `${info.host}:${info.port}, pigpioVersion: ${info.pigpioVersion}`
    );
    this.logger.debug(`PigpioClient connection info: ${JSON.stringify(info)}`);
    this.renewInstances();
    this.connectionPromised.resolve();
  }

  /**
   * It rises once only if client has already connected.
   */
  private handleDisconnect = (reason: string): void => {
    this.logger.debug(`PigpioClient received disconnected event, reason: ${reason}`);

    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

    // means not connected
    if (!this.client) return;

    // remove listeners
    try {
      for (let pin of Object.keys(this.pinInstances)) {
        // TODO: better to do destroy ???
        this.pinInstances[pin].$removeListeners();
      }
    }
    catch (e) {
      this.logger.warn(`PigpioClient: error on remove listeners: ${e}`);
    }

    // renew promised if need
    if (this.connectionPromised.isFulfilled()) {
      this.connectionPromised.destroy();

      this.connectionPromised = new Promised<void>();
    }

    this.logger.info(`PigpioClient reconnecting after disconnect in ${RECONNECT_TIMEOUT_SEC} sec`);

    setTimeout(this.doReconnect, RECONNECT_TIMEOUT_SEC * 1000);
  }

  private handleError = (err: {message: string}) => {
    this.logger.error(`PigpioClient: ${err.message}`);
  }

  private connect() {
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

    this.logger.info(
      `... Connecting to pigpiod daemon: ` +
      `${compactUndefined([this.clientOptions.host, this.clientOptions.port]).join(':')}`
    );

    try {
      this.client = pigpioClient.pigpio(this.clientOptions) as Client;
    }
    catch (e) {
      this.logger.error(e);
      this.doReconnect();

      return;
    }

    this.client.on('error', this.handleError);
    this.client.once('connected', this.handleConnected);
    this.client.once('disconnected', this.handleDisconnect);

    this.connectionTimeout = setTimeout(this.doReconnect, RECONNECT_TIMEOUT_SEC * 1000);
  }

  private doReconnect = () => {
    this.logger.info(`PigpioClient reconnecting`);
    this.client && this.client.end();
    this.clearListeners();
    this.connect();
  }

  private clearListeners() {
    if (!this.client) return;

    this.client.removeListener('error', this.handleError);
    this.client.removeListener('disconnected', this.handleDisconnect);
    this.client.removeListener('connected', this.handleConnected);
  }

  private renewInstances() {
    if (!this.client) {
      throw new Error(`PigpioClient: Client hasn't been connected`);
    }

    for (let pin of Object.keys(this.pinInstances)) {
      this.pinInstances[pin].$renew(this.client.gpio(Number(pin)));
    }
  }

}


export default function instantiatePigpioClient(logger: Logger): PigpioClient {
  if (!instance) {
    instance = new PigpioClient(logger);
  }

  return instance;
}
