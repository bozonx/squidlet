/**
 * The same for rpi and x86
 */

import * as mqtt from 'mqtt';

import MqttIo, {MqttProps, MqttIoEvents} from 'system/interfaces/io/MqttIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {callPromised} from 'system/helpers/helpers';


export default class Mqtt implements MqttIo {
  private readonly events = new IndexedEventEmitter();
  private readonly connections: mqtt.MqttClient[] = [];


  async destroy() {
    for (let connectionId in this.connections) {
      await this.close(connectionId);
    }
  }

  // TODO: add isConnected - mqtt.Client#connected

  async newConnection(props: MqttProps): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, props) );

    return connectionId;
  }

  async reConnect(connectionId: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)].reconnect();

    // await this.close(connectionId, 0);
    //
    // this.connections[Number(connectionId)] = this.connectToServer(connectionId, props);
  }

  async onOpen(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.open, cb);
  }

  async onClose(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.close, cb);
  }

  async onMessage(cb: (connectionId: string, topic: string, data?: string | Uint8Array) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.message, cb);
  }

  async onError(cb: (connectionId: string, err: Error) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.error, cb);
  }

  async removeEventListener(eventName: MqttIoEvents, handlerId: number): Promise<void> {
    this.events.removeListener(eventName, handlerId);
  }

  async close(connectionId: string, force: boolean = false): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    return callPromised(this.connections[Number(connectionId)].end, force);
  }

  publish(connectionId: string, topic: string, data?: string | Uint8Array): Promise<void> {
    // TODO: !!!!
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
    // TODO: !!!!
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


  private connectToServer(connectionId: string, props: MqttProps): mqtt.MqttClient {
    // TODO: !!!!
    const url = `${params.protocol}://${params.host}:${params.port}`;
    this.client = mqtt.connect(url);

    this.connectPromise = new Promise((resolve) => {
      this.client.on('connect', () => {
        this._connected = true;
        resolve();
      });
    });

    const handlerWrapper = (topic: string, data: Buffer) => {
      handler(topic, data.toString());
    };

    this.client.on('message', handlerWrapper);

    // TODO: add events - error, open, close , message
  }

}
