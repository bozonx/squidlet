// need to decrease of memory usage
import IndexedEvents from '../../../system/lib/IndexedEvents';

require('mqtt-packet').writeToStream.cacheNumbers = false;

import * as mqtt from 'mqtt';

import MqttIo, {MqttOptions, MqttIoEvents} from 'system/interfaces/io/MqttIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';


//type MqttContentTypes = 'string' | 'binary';

// interface MqttPacket {
//   properties: {
//     contentType: MqttContentTypes;
//   };
// }

// TODO: add special errors on lost connection
// TODO: может определять старые зависшие соединения - по таймауту последнего использования например -
//       тогда если соединение оборвется то в connection manager оно всеравно создастся заного.


/**
 * The same for rpi and x86
 */
export default class Mqtt implements MqttIo {
  private readonly events = new IndexedEventEmitter();
  private readonly connections: mqtt.MqttClient[] = [];


  async destroy() {
    this.events.destroy();

    for (let connectionId in this.connections) {
      await this.close(connectionId);

      // TODO: наверное поднять события onEnd
    }
  }


  async newConnection(url: string, options: MqttOptions): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, url, options) );

    // TODO: поднять событие как только будет подписка на событие onConnect.
    //       либо это событие не поднимать в начале только на reconnect

    // TODO: если после создания connectionId не навешалось ни одного события -
    //       то можно его удалить через 120 сек

    return connectionId;
  }

  async reConnect(connectionId: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)].reconnect();
  }

  async close(connectionId: string, force: boolean = false): Promise<void> {
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


  async onConnect(connectionId: string, cb: () => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.connect, connectionId), cb);
  }

  // TODO: только когда удаляем connectionId и закрываем соединение
  async onClose(connectionId: string, cb: () => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.close, connectionId), cb);
  }

  async onDisconnect(connectionId: string, cb: () => void): Promise<number> {
    // TODO: add
  }

  async onMessage(connectionId: string, cb: (topic: string, data: Uint8Array) => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.message, connectionId), cb);
  }

  async onError(connectionId: string, cb: (err: string) => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.error, connectionId), cb);
  }

  async removeListener(handlerId: number): Promise<void> {
    this.events.removeListener(handlerId);
  }

  async publish(connectionId: string, topic: string, data: string | Uint8Array): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`Mqtt.publish: code 1001: No connection "${connectionId}"`);
    }

    //let contentType: MqttContentTypes;
    let preparedData: string | Buffer;

    if (typeof data === 'string') {
      //contentType = 'string';
      preparedData = data;
    }
    // else if (typeof data === 'undefined') {
    //   contentType = 'binary';
    //   preparedData = new Buffer([]);
    // }
    else {
      //contentType = 'binary';
      preparedData = new Buffer(data);
    }

    // const options = {
    //   properties: {
    //     contentType
    //   }
    // };

    const client = this.connections[Number(connectionId)];

    return callPromised(client.publish.bind(client), topic, preparedData);
    //return callPromised(client.publish.bind(client), topic, preparedData, options);
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

    //connection.on('message', (topic: string, data: Buffer, packet: MqttPacket) => {
    connection.on('message', (topic: string, data: Buffer) => {
      //const contentType: string | undefined = packet.properties && packet.properties.contentType;
      this.handleIncomeMessage(connectionId, topic, data);
    });
    connection.on('error', (err: Error) =>
      this.events.emit(this.makeEventName(MqttIoEvents.error, connectionId), String(err))
    );
    connection.on('connect',() =>
      this.events.emit(this.makeEventName(MqttIoEvents.connect, connectionId))
    );
    connection.on('close',
      () => this.events.emit(this.makeEventName(MqttIoEvents.close, connectionId)));

    return connection;
  }

  /**
   * If no data then Buffer will be empty.
   */
  private handleIncomeMessage = (
    connectionId: string,
    topic: string,
    data: Buffer,
    //contentTypeProperty: string | undefined
  ) => {
    let preparedData: Uint8Array = convertBufferToUint8Array(data);
    //const binaryContentType: MqttContentTypes = 'binary';

    // if (contentTypeProperty === binaryContentType) {
    //   preparedData = convertBufferToUint8Array(data);
    // }
    // else {
    //   // not contentType or 'string'
    //   preparedData = data.toString();
    // }

    this.events.emit(this.makeEventName(MqttIoEvents.message, connectionId), topic, preparedData);
  }

  private makeEventName(eventNum: MqttIoEvents, connectionId: string): string {
    return `${eventNum}-${connectionId}`
  }

}
