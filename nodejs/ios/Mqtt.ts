/**
 * The same for rpi and x86
 */

import * as mqtt from 'mqtt';

import MqttIo, {MqttProps} from 'system/interfaces/io/MqttIo';


export default class Mqtt implements MqttIo {
  newConnection(params: MqttProps) {
    const url = `${params.protocol}://${params.host}:${params.port}`;
    this.client = mqtt.connect(url);

    this.connectPromise = new Promise((resolve) => {
      this.client.on('connect', () => {
        this._connected = true;
        resolve();
      });
    });
  }




  destroy = async () => {
    // TODO: close connections
  }

  connectPromise: Promise<void>;

  private _connected: boolean = false;
  private readonly client: any;

  // TODO: поддержка нескольких соединений как в ws

  async isConnected(): Promise<boolean> {
    return this._connected;
  }



  publish(topic: string, data?: string | Uint8Array): Promise<void> {
    // TODO: support of options

    return new Promise((resolve, reject) => {
      this.connectPromise
        .then(() => {
          this.client.publish(topic, data, {}, (err: string): void => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
    });
  }

  subscribe(topic: string): Promise<void> {
    // TODO: support of options

    return new Promise((resolve, reject) => {
      this.connectPromise
        .then(() => {
          this.client.subscribe(topic, {}, (err: string, granted: {topic: string, qos: number}) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
    });
  }

  async onMessage(handler: (topic: string, data: string) => void) {
    const handlerWrapper = (topic: string, data: Buffer) => {
      handler(topic, data.toString());
    };

    this.client.on('message', handlerWrapper);
  }

  // /**
  //  * Subscribe to binary data
  //  */
  // async onMessageBin() {
  //   // TODO: convert to Uint8Array
  // }

  // TODO: сделать offMessage и тд
  // TODO: add close connection

}
