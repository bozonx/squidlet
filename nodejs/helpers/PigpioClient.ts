import {callPromised} from '../../system/lib/common';
import PigpioWrapper, {PigpioInfo, PigpioOptions} from './PigpioWrapper';
import Promised from '../../system/lib/Promised';
import {compactUndefined} from '../../system/lib/arrays';
import Logger from '../../system/interfaces/Logger';

const pigpioClient = require('pigpio-client');


const CONNECTION_TRY_TIMEOUT_SEC = 20;
const RECONNECT_TIMEOUT_SEC = 1;
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
  private client: any;
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

    // TODO: может зависнуть
    await callPromised(this.client.end);

    delete this.client;
  }


  isPinInitialized(pin: number): boolean {
    return Boolean(this.pinInstances[pin]);
  }

  getPinInitialized(pin: number): PigpioWrapper | undefined {
    return this.pinInstances[pin];
  }

  makePinInstance(pin: number): PigpioWrapper {
    if (this.pinInstances[pin]) {
      throw new Error(`PigpioClient: pin has been already instantiated`);
    }

    this.pinInstances[pin] = new PigpioWrapper(this.client.gpio(pin));

    return this.pinInstances[pin];
  }

  clearPin(pin: number) {
    delete this.pinInstances[pin];
  }

  getInstantiatedPinList(): string[] {
    return Object.keys(this.pinInstances);
  }


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

  private handleDisconnect = (reason: string): void => {
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

    this.logger.debug(`PigpioClient received disconnected event, reason: ${reason}`);

    // means destroyed
    if (!this.client) return;

    // renew promised if need
    if (this.connectionPromised.isFulfilled()) {
      this.connectionPromised.destroy();

      this.connectionPromised = new Promised<void>();
    }

    // means destroyed
    if (!this.client) return;

    this.logger.info(`PigpioClient reconnecting in ${RECONNECT_TIMEOUT_SEC} sec`);

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
      this.client = pigpioClient.pigpio(this.clientOptions);
    }
    catch (e) {
      this.logger.error(e);
      this.doReconnect();

      return;
    }

    this.client.on('error', this.handleError);
    this.client.once('connected', this.handleConnected);
    this.client.once('disconnected', this.handleDisconnect);

    this.connectionTimeout = setTimeout(this.doReconnect, CONNECTION_TRY_TIMEOUT_SEC * 1000);
  }

  private doReconnect = () => {
    this.logger.info(`PigpioClient reconnecting`);
    // TODO: check if ws connected or not otherwise it won't ever be called.
    // this.client.end((e: Error) => {
    //   if (e) this.logger.warn(`PigpioClient error on end: ${e}`);
    // });
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
