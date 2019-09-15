import * as SerialPort from 'serialport';
import {OpenOptions} from 'serialport';

import SerialIo, {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams
} from 'system/interfaces/io/SerialIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';


type SerialItem = [
  SerialPort,
  IndexedEventEmitter<AnyHandler>
];

enum ItemPostion {
  serialPort,
  events,
}

let portParams: {[index: string]: SerialParams} = {};


export default class Serial implements SerialIo {
  private readonly instances: {[index: string]: SerialItem} = {};


  async configure(newDefinition: SerialDefinition) {
    portParams = newDefinition.ports;
  }

  async destroy() {
    for (let portNum of Object.keys(this.instances)) {
      this.destroyPort(Number(portNum));
    }
  }


  async destroyPort(portNum: number) {
    this.instances[portNum][ItemPostion.events].destroy();
    // TODO: отписать хэндлеры
    delete this.instances[portNum];
  }

  async onData(portNum: number, handler: (data: string | Uint8Array) => void): Promise<number> {
    return this.getItem(portNum)[ItemPostion.events].addListener(SerialEvents.data, handler);
  }

  async onError(portNum: number, handler: (err: string) => void): Promise<number> {
    return this.getItem(portNum)[ItemPostion.events].addListener(SerialEvents.error, handler);
  }

  async write(portNum: number, data: Uint8Array): Promise<void> {
    let value: Buffer;

    if (typeof data === 'object' && (data as any).data && (data as any).count) {
      // TODO: взять только заданную длинну или просто проверить что данные нужно длинны ???
      value = Buffer.from(data as any);
    }
    else {
      value = Buffer.from(data as any);
    }

    // TODO: use async version
    this.getItem(portNum)[ItemPostion.serialPort].write(value);
  }

  async print(portNum: number, data: string): Promise<void> {
    this.getItem(portNum)[ItemPostion.serialPort].write(data);
  }

  async println(portNum: number, data: string): Promise<void> {
    this.getItem(portNum)[ItemPostion.serialPort].write(`${data}\r\n`);
  }

  async read(portNum: number, length?: number): Promise<string | Uint8Array> {
    const result: string | Buffer | null = this.getItem(portNum)[ItemPostion.serialPort].read(length);

    return this.parseIncomeData(result);
  }

  async removeListener(portNum: number, eventName: SerialEvents, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPostion.events].removeListener(eventName, handlerIndex);
  }

  private getItem(portNum: number): SerialItem {
    if (this.instances[portNum]) return this.instances[portNum];

    this.instances[portNum] = this.makePortItem(portNum);

    return this.instances[portNum];
  }

  private makePortItem(portNum: number): SerialItem {
    const params: SerialParams = {
      ...defaultSerialParams,
      ...portParams[portNum],
    };

    if (!params.dev) {
      throw new Error(
        `Params of serial port ${portNum} has to have a "dev" parameter ` +
        `which points to serial device`
      );
    }

    const options: OpenOptions = omitObj(params, 'dev', 'rxPin', 'txPin');
    const serialPort: SerialPort = new SerialPort(params.dev, options);
    const events = new IndexedEventEmitter<AnyHandler>();

    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(portNum, data));
    serialPort.on('error', (err) => events.emit(SerialEvents.error, err.message));

    if (serialPort.isOpen) {
      // TODO: заем сразу поднимать????
      events.emit(SerialEvents.open);
    }
    else {
      serialPort.on('open', () => events.emit(SerialEvents.open));
    }

    return [
      serialPort,
      events
    ];
  }

  private handleIncomeData(portNum: number, data: string | Buffer | null) {
    const parsedData: string | Uint8Array = this.parseIncomeData(data);

    this.getItem(portNum)[ItemPostion.events].emit(SerialEvents.data, parsedData);
  }

  private parseIncomeData(data: string | Buffer | null): string | Uint8Array {
    if (!data) {
      return '';
    }
    else if (typeof data === 'string') {
      //return textToUint8Array(data);

      return data;
    }
    else if (Buffer.isBuffer(data)) {
      return convertBufferToUint8Array(data as Buffer);
    }

    throw new Error(`Unknown type of returned value "${JSON.stringify(data)}"`);
  }

}
