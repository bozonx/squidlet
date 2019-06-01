/**
 * The same for rpi and x86
 */

import * as mqtt from 'mqtt';

import MqttIo, {MqttOptions, MqttIoEvents} from 'system/interfaces/io/MqttIo';
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

  async newConnection(url: string, options: MqttOptions): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, url, options) );

    return connectionId;
  }

  async reConnect(connectionId: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)].reconnect();
  }

  async close(connectionId: string, force: boolean = false): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    return callPromised(this.connections[Number(connectionId)].end, force);
  }

  async isConnected(connectionId: string): Promise<boolean> {
    return this.connections[Number(connectionId)].connected;
  }

  async isDisconnecting(connectionId: string): Promise<boolean> {
    return this.connections[Number(connectionId)].disconnecting;
  }

  async isDisconnected(connectionId: string): Promise<boolean> {
    return this.connections[Number(connectionId)].disconnected;
  }

  async isReconnecting(connectionId: string): Promise<boolean> {
    return this.connections[Number(connectionId)].reconnecting;
  }


  async onConnect(cb: (connectionId: string) => void): Promise<number> {
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


  private connectToServer(connectionId: string, url: string, options: MqttOptions): mqtt.MqttClient {
    const connection = mqtt.connect(url, options);

    connection.on('message', (topic: string, data: Buffer) => {
      this.handleIncomeMessage(connectionId, topic, data);
    });
    connection.on('error', (err) => this.events.emit(MqttIoEvents.error, connectionId, err));
    connection.on('connect', () => this.events.emit(MqttIoEvents.connect, connectionId));
    connection.on('close', () => this.events.emit(MqttIoEvents.close, connectionId));

    return connection;
  }

  private handleIncomeMessage = (connectionId: string, topic: string, data: Buffer) => {
    // TODO: check if it is a bin and don't convert

    const preparedData: undefined | string | Uint8Array = data.toString();

    this.events.emit(MqttIoEvents.message, connectionId, topic, preparedData);
  }

}
