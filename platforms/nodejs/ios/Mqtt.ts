// need to decrease of memory usage
import * as mqtt from 'mqtt';

import MqttIo, {MqttIoEvents, MqttOptions} from 'system/interfaces/io/MqttIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import {CError} from 'system/lib/CError';
import {MqttClient} from 'mqtt/types/lib/client';

require('mqtt-packet').writeToStream.cacheNumbers = false;


//type MqttContentTypes = 'string' | 'binary';

interface MqttPacket {
  // properties: {
  //   contentType: MqttContentTypes;
  // };
}

// TODO: add special errors on lost connection
// TODO: может определять старые зависшие соединения - по таймауту последнего использования например -
//       тогда если соединение оборвется то в connection manager оно всеравно создастся заного.
// TODO: подумать что будет с навешанными событиями через Remotecall ??? при потере соединения
//       обработчики всеравно останутся и нельзя гарантированно сказать что обработчики уже не нужны

const TIMEOUT_OF_CONNECTION_SEC = 20;


/**
 * The same for rpi and x86
 */
export default class Mqtt implements MqttIo {
  private readonly events = new IndexedEventEmitter();
  // TODO: лучше делать объект так как connectionId могут множиться ключи это hex бесконечного индекса
  private readonly connections: mqtt.MqttClient[] = [];


  async destroy() {
    this.events.destroy();

    for (let connectionId in this.connections) {
      await this.close(connectionId);

      // TODO: наверное поднять события onEnd
    }
  }

  // async init() {
  // }


  async newConnection(url: string, options: MqttOptions): Promise<string> {
    const connectionId = String(this.connections.length);

    return new Promise<string>((resolve, reject) => {
      try {
        this.connectToServer(connectionId, url, options);
      }
      catch (e) {
        return reject(e);
      }

      let handlerIndex: number;
      const connectionTimeout = setTimeout(() => {
        this.events.removeListener(handlerIndex);
        reject(`Timeout of connection has been exceeded`);
      }, TIMEOUT_OF_CONNECTION_SEC * 1000);

      handlerIndex = this.events.once(this.makeEventName(MqttIoEvents.connect, connectionId), () => {
        clearTimeout(connectionTimeout);
        resolve(connectionId);
      });
    });
  }

  async close(connectionId: string, force: boolean = false): Promise<void> {
    if (!this.connections[Number(connectionId)]) return;

    const client = this.connections[Number(connectionId)];

    // TODO: удалить все хэндлеры и connectionId

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

  async onClose(connectionId: string, cb: () => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.close, connectionId), cb);
  }

  async onDisconnect(connectionId: string, cb: () => void): Promise<number> {
    return this.events.addListener(this.makeEventName(MqttIoEvents.disconnect, connectionId), cb);
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
      throw new CError(1001, `Mqtt.publish: No connection "${connectionId}"`);
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
      throw new CError(1001, `Mqtt.subscribe: No connection "${connectionId}"`);
    }

    const client = this.connections[Number(connectionId)];

    return callPromised(client.subscribe.bind(client), topic);
  }

  unsubscribe(connectionId: string, topic: string): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new CError(1001, `Mqtt.unsubscribe: No connection "${connectionId}"`);
    }

    const client = this.connections[Number(connectionId)];

    return callPromised(client.unsubscribe.bind(client), topic);
  }


  private connectToServer(connectionId: string, url: string, options: MqttOptions) {
    const client: mqtt.MqttClient = mqtt.connect(url, options);

    this.connections.push(client);

    client.on('message', (topic: string, data: Buffer, packet: MqttPacket) => {
      //const contentType: string | undefined = packet.properties && packet.properties.contentType;
      this.handleIncomeMessage(connectionId, topic, data);
    });
    client.on('error', (err: Error) =>
      this.events.emit(this.makeEventName(MqttIoEvents.error, connectionId), String(err))
    );
    client.on('connect',() =>
      this.events.emit(this.makeEventName(MqttIoEvents.connect, connectionId))
    );
    client.on('close', () => this.handleClose(connectionId));
    client.on('disconnect', (packet: MqttPacket) => this.handleDisconnect(connectionId, packet));
    // Other interesting events: offline, reconnect
  }

  private handleClose = (connectionId: string) => {
    // TODO: только когда удаляем connectionId и закрываем соединение

    // TODO: удалить все хэндлеры и connectionId

    this.events.emit(this.makeEventName(MqttIoEvents.close, connectionId));
  }

  private handleDisconnect = (connectionId: string, packet: MqttPacket) => {

    // TODO: add on disconnect event - MqttIoEvents.disconnect
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
    return `${eventNum}-${connectionId}`;
  }

}


// TODO: наверноене нужно -  при потере соединения просто делать close и заного соединяться
// async reConnect(connectionId: string): Promise<void> {
//   if (!this.connections[Number(connectionId)]) return;
//
//   this.connections[Number(connectionId)].reconnect();
// }
