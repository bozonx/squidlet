/**
 * The same for rpi and x86
 */

import * as mqtt from 'mqtt';

import MqttIo, {MqttProps} from 'system/interfaces/io/MqttIo';
import IndexedEventEmitter from '../../system/helpers/IndexedEventEmitter';


export default class Mqtt implements MqttIo {
  private readonly events = new IndexedEventEmitter();
  private readonly clients: mqtt.Client[];


  destroy = async () => {
    // TODO: close connections
  }


  newConnection(params: MqttProps): Promise<string> {
    const url = `${params.protocol}://${params.host}:${params.port}`;
    this.client = mqtt.connect(url);

    this.connectPromise = new Promise((resolve) => {
      this.client.on('connect', () => {
        this._connected = true;
        resolve();
      });
    });
  }

  reConnect(connectionId: string, props: MqttProps): Promise<void> {

  }

  onOpen(cb: (connectionId: string) => void): Promise<number> {

  }

  onClose(cb: (connectionId: string) => void): Promise<number> {

  }

  async onMessage(handler: (connectionId: string, topic: string, data: string) => void) {
    const handlerWrapper = (topic: string, data: Buffer) => {
      handler(topic, data.toString());
    };

    this.client.on('message', handlerWrapper);
  }

  onError(cb: (connectionId: string, err: Error) => void): Promise<number> {

  }

  close(connectionId: string, code: number, reason?: string): Promise<void> {

  }

  publish(connectionId: string, topic: string, data?: string | Uint8Array): Promise<void> {
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

  subscribe(connectionId: string, topic: string): Promise<void> {
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

}
