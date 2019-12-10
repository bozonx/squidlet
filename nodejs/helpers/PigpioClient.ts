import {callPromised} from '../../system/lib/common';
import PigpioWrapper, {PigpioInfo, PigpioOptions} from './PigpioWrapper';
import Promised from '../../system/lib/Promised';
import {compactUndefined} from '../../system/lib/arrays';
import Logger from '../../system/interfaces/Logger';

const pigpioClient = require('pigpio-client');


//const CONNECTION_TIMEOUT_MS = 60000;
const RECONNECT_TIMEOUT_SEC = 1;
const DEFAULT_OPTIONS = {
  host: 'localhost',
  timeout: 0,
};
let client: PigpioClient | undefined;


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


  constructor(logger: Logger) {
    this.logger = logger;
  }


  init(clientOptions: PigpioOptions): Promise<void>{
    if (this.inited) {
      this.logger.warn(`PigpioClient: Disallowed to init more then one time`);

      return Promise.resolve();
    }

    this.clientOptions = {
      ...this.clientOptions,
      ...clientOptions,
    };

    this.client = pigpioClient.pigpio(this.clientOptions);
    this.hasBeenInited = true;

    this.logger.info(
      `... Connecting to pigpiod daemon: ` +
      `${compactUndefined([this.clientOptions.host, this.clientOptions.port]).join(':')}`
    );

    // Errors are emitted unless you provide API with callback.
    this.client.on('error', (err: {message: string})=> {
      this.logger.error(`PigpioClient: ${err.message}`);
      //if (!this.hasBeenConnected) reject(`Can't connect: ${JSON.stringify(err)}`);
    });

    this.client.on('disconnected', this.handleDisconnect);

    return this.makeInitPromise();
  }

  async destroy(): Promise<void> {
    await callPromised(this.client.end);
    this.connectionPromised.destroy();

    delete this.connectionPromised;
    delete this.client;
  }


  makePinInstance(pin: number): PigpioWrapper {
    return new PigpioWrapper(this.client.gpio(pin));
  }


  private makeInitPromise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.once('connected', (info: PigpioInfo) => {
        this.handleConnected(info);
        resolve();
      });

      // setTimeout(() => {
      //   if (this.connected) return;
      //   reject(`Can't connect to pigpiod, timeout has been exceeded`);
      // }, CONNECTION_TIMEOUT_MS);
    });
  }

  private handleConnected = (info: PigpioInfo): void => {
    this.logger.info('PigpioClient has been connected successfully to the pigpio daemon');
    this.logger.debug(`PigpioClient connection info: ${JSON.stringify(info)}`);
    this.connectionPromised.resolve();
  }

  private handleDisconnect = (reason: string): void => {
    this.logger.debug(`PigpioClient received disconnected event, reason: ${reason}`);

    // means destroyed
    if (!this.client) return;

    this.logger.info(`PigpioClient reconnecting in ${RECONNECT_TIMEOUT_SEC} sec`);

    // renew promised if need
    if (this.connectionPromised.isFulfilled()) {
      this.connectionPromised.destroy();

      this.connectionPromised = new Promised<void>();
    }

    setTimeout(() => {
      this.reconnect()
        .catch(this.logger.error);
    }, RECONNECT_TIMEOUT_SEC * 1000);
  }

  private reconnect = async () => {
    try {
      await callPromised(this.client.connect, this.clientOptions);
    }
    catch (e) {
      this.logger.debug(`PigpioClient: Can't reconect: ${e}`);

      setTimeout(() => {
        this.reconnect()
          .catch(this.logger.error);
      }, RECONNECT_TIMEOUT_SEC * 1000);
    }
  }

}


export default function instantiatePigpioClient(logger: Logger): PigpioClient {
  if (!client) {
    client = new PigpioClient(logger);
  }

  return client;
}
