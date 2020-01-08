// need to decrease of memory usage
require('mqtt-packet').writeToStream.cacheNumbers = false;

import * as mqtt from 'mqtt';

import MqttIo, {MqttOptions, MqttIoEvents} from 'system/interfaces/io/MqttIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';


type MqttContentTypes = 'string' | 'binary';

interface MqttPacket {
  properties: {
    contentType: MqttContentTypes;
  };
}


/**
 * The same for rpi and x86
 */
export default class Mqtt implements MqttIo {
  private readonly events = new IndexedEventEmitter();
  private readonly connections: mqtt.MqttClient[] = [];


  async destroy() {
    this.events.destroy();

    for (let connectionId in this.connections) {
      await this.end(connectionId);
    }
  }


  async newConnection(url: string, options: MqttOptions): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, url, options) );

    return connectionId;
  }

  async reConnect(connectionId: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)].reconnect();
  }

  async end(connectionId: string, force: boolean = false): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    const client = this.connections[Number(connectionId)];

    return callPromised(client.end.bind(client), force);
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
    return this.events.addListener(MqttIoEvents.connect, cb);
  }

  async onClose(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.close, cb);
  }

  async onMessage(cb: (connectionId: string, topic: string, data: string | Uint8Array) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.message, cb);
  }

  async onError(cb: (connectionId: string, err: Error) => void): Promise<number> {
    return this.events.addListener(MqttIoEvents.error, cb);
  }

  async removeListener(handlerId: number): Promise<void> {
    this.events.removeListener(handlerId);
  }

  async publish(connectionId: string, topic: string, data?: string | Uint8Array): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`Mqtt.publish: There isn't a connection "${connectionId}"`);
    }

    let contentType: MqttContentTypes;
    let preparedData: string | Buffer;

    if (typeof data === 'string') {
      contentType = 'string';
      preparedData = data;
    }

    // TODO: data может быть undefined ????? может и передавать undefined а не bufer

    else if (typeof data === 'undefined') {
      contentType = 'binary';
      preparedData = new Buffer([]);
    }
    else {
      contentType = 'binary';
      preparedData = new Buffer(data);
    }

    const options = {
      properties: {
        contentType
      }
    };

    const client = this.connections[Number(connectionId)];

    return callPromised(client.publish.bind(client), topic, preparedData, options);
  }

  subscribe(connectionId: string, topic: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`Mqtt.subscribe: There isn't a connection "${connectionId}"`);
    }

    const client = this.connections[Number(connectionId)];

    return callPromised(client.subscribe.bind(client), topic);
  }

  unsubscribe(connectionId: string, topic: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`Mqtt.unsubscribe: There isn't a connection "${connectionId}"`);
    }

    const client = this.connections[Number(connectionId)];

    return callPromised(client.unsubscribe.bind(client), topic);
  }


  private connectToServer(connectionId: string, url: string, options: MqttOptions): mqtt.MqttClient {
    const connection = mqtt.connect(url, options);

    connection.on('message', (topic: string, data: Buffer, packet: MqttPacket) => {
      // TODO: review
      const contentType: string | undefined = packet.properties && packet.properties.contentType;

      this.handleIncomeMessage(connectionId, topic, data, contentType);
    });
    connection.on('error', (err) => this.events.emit(MqttIoEvents.error, connectionId, err));
    connection.on('connect', () => this.events.emit(MqttIoEvents.connect, connectionId));
    connection.on('close', () => this.events.emit(MqttIoEvents.close, connectionId));

    return connection;
  }

  /**
   * If no data then Buffer will be empty.
   */
  private handleIncomeMessage = (
    connectionId: string,
    topic: string,
    data: Buffer,
    contentTypeProperty: string | undefined
  ) => {
    let preparedData: string | Uint8Array;
    const binaryContentType: MqttContentTypes = 'binary';

    if (contentTypeProperty === binaryContentType) {
      preparedData = convertBufferToUint8Array(data);
    }
    else {
      // not contentType or 'string'
      preparedData = data.toString();
    }

    this.events.emit(MqttIoEvents.message, connectionId, topic, preparedData);
  }

}
