import {callPromised} from '../../system/lib/common';
import PigpioWrapper, {PigpioOptions} from './PigpioWrapper';

const pigpioClient = require('pigpio-client');


const CONNECTION_TIMEOUT = 60000;
const DEFAULT_OPTIONS = {
  host: 'localhost'
};


export class PigpioClient {
  private wasConnected = false;
  // private clientOptions: PigpioOptions = {
  //   host: 'localhost',
  // };
  private client: any;


  async init(clientOptions: PigpioOptions) {
    const options: PigpioOptions = {
      ...DEFAULT_OPTIONS,
      ...clientOptions,
    };

    this.client = pigpioClient.pigpio(options);

    return new Promise<void>((resolve, reject) => {
      console.log(`... Connecting to pigpiod daemon`);

      this.client.once('connected', (info: {[index: string]: string}) => {
        // display information on pigpio and connection status
        console.log('SUCCESS: Pigpio client has been connected successfully to the pigpio daemon');
        console.log(`pigpio connection info: ${JSON.stringify(info)}`);

        // this.client.getInfo((aa: any, dd: any) => {
        //   console.log('----------------- info', aa, dd );
        // });

        this.wasConnected = true;
        resolve();
      });

      // Errors are emitted unless you provide API with callback.
      this.client.on('error', (err: {message: string})=> {
        console.error('Pigpio client received error: ', err.message); // or err.stack

        if (!this.wasConnected) reject(`Can't connect: ${JSON.stringify(err)}`);
      });

      this.client.on('disconnected', (reason: string) => {
        console.log('Pigpio client received disconnected event, reason: ', reason);
        console.log('Pigpio client reconnecting in 1 sec');
        // TODO: нужно ли делать reconnect ???
        //setTimeout( this.client.connect, 1000, {host: 'raspberryHostIP'});
      });

      // TODO: review
      setTimeout(() => {
        if (this.wasConnected) return;
        reject(`Can't connect to pigpiod, timeout has been exceeded`);
      }, CONNECTION_TIMEOUT);
    });
  }

  async destroy(): Promise<void> {
    await callPromised(this.client.end);

    // TODO: destroy

    // TODO: use gpio.endNotify(cb)
  }


  makePinInstance(pin: number): PigpioWrapper {
    return new PigpioWrapper(this.client.gpio(pin));
  }

}

export default function instantiatePigpioClient(): PigpioClient {

}
