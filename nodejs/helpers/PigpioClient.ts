import {callPromised} from '../../system/lib/common';
import PigpioWrapper, {PigpioInfo, PigpioOptions} from './PigpioWrapper';
import Promised from '../../system/lib/Promised';

const pigpioClient = require('pigpio-client');


//const CONNECTION_TIMEOUT_MS = 60000;
const RECONNECT_TIMEOUT_SEC = 1;
const DEFAULT_OPTIONS = {
  host: 'localhost'
};


export class PigpioClient {
  get inited(): boolean {
    return this.hasBeenInited;
  }

  get connected(): boolean {
    return this.hasBeenConnected;
  }

  get connectionPromise(): Promise<void> {
    return this.connectionPromised.promise;
  }

  private logInfo: (msg: string) => void;
  private logDebug: (msg: string) => void;
  private logError: (msg: string | Error) => void;
  private hasBeenConnected = false;
  private clientOptions: PigpioOptions = DEFAULT_OPTIONS;
  private client: any;
  private connectionPromised = new Promised<void>();
  private hasBeenInited: boolean = false;


  constructor(
    logInfo: (msg: string) => void,
    logDebug: (msg: string) => void,
    logError: (msg: string | Error) => void
  ) {
    this.logInfo = logInfo;
    this.logDebug = logDebug;
    this.logError = logError;
  }


  init(clientOptions: PigpioOptions): Promise<void>{
    if (this.inited) throw new Error(`Disallowed to init more then one time`);

    this.clientOptions = {
      ...this.clientOptions,
      ...clientOptions,
    };

    this.client = pigpioClient.pigpio(this.clientOptions);
    this.hasBeenInited = true;

    this.logInfo(
      `... Connecting to pigpiod daemon: ${this.clientOptions.host}:${this.clientOptions.port}`
    );

    // Errors are emitted unless you provide API with callback.
    this.client.on('error', (err: {message: string})=> {
      this.logError(`Pigpio client: ${err.message}`);
      //if (!this.hasBeenConnected) reject(`Can't connect: ${JSON.stringify(err)}`);
    });

    this.client.on('disconnected', this.handleDisconnect);

    return this.makeInitPromise();
  }

  async destroy(): Promise<void> {
    await callPromised(this.client.end);

    // TODO: destroy

    // TODO: use gpio.endNotify(cb)
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
      //   if (this.hasBeenConnected) return;
      //   reject(`Can't connect to pigpiod, timeout has been exceeded`);
      // }, CONNECTION_TIMEOUT_MS);
    });
  }

  private handleConnected = (info: PigpioInfo): void => {
    this.logInfo('Pigpio client has been connected successfully to the pigpio daemon');
    this.logDebug(`pigpio connection info: ${JSON.stringify(info)}`);
    this.hasBeenConnected = true;
    // TODO: resolve promise
  }

  private handleDisconnect = (reason: string): void => {
    this.hasBeenConnected = false;
    // TODO: renew Promise ????
    this.logDebug(`Pigpio client received disconnected event, reason: ${reason}`);
    this.logInfo(`Pigpio client reconnecting in ${RECONNECT_TIMEOUT_SEC} sec`);
    // TODO: если был вызван destroy то не нужно делать переконнект
    setTimeout( this.client.connect, RECONNECT_TIMEOUT_SEC * 1000, this.clientOptions);
  }

}

// TODO: это нужно ????
// export default function instantiatePigpioClient(): PigpioClient {
//   return new PigpioClient();
// }
