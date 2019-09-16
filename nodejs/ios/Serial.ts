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
import {callPromised} from 'system/lib/common';
import {ENCODE, SERVER_STARTING_TIMEOUT_SEC} from 'system/constants';


type SerialItem = [
  SerialPort,
  IndexedEventEmitter<AnyHandler>
];

enum ItemPostion {
  serialPort,
  events,
}

let portParams: {[index: string]: SerialParams} = {};
let unnamedPortNumIndex = 0;


export default class Serial implements SerialIo {
  private readonly instances: {[index: string]: SerialItem} = {};


  async configure(newDefinition: SerialDefinition) {
    portParams = newDefinition.ports;
  }

  async newPort(portNum: number | undefined, paramsOverride: SerialParams): Promise<number> {
    const resolvedPortNum = this.resolvePortNum(portNum);

    if (!this.instances[resolvedPortNum]) {
      this.instances[resolvedPortNum] = await this.makePortItem(resolvedPortNum, paramsOverride);
    }

    return resolvedPortNum;
  }

  async destroy() {
    for (let portNum of Object.keys(this.instances)) {
      this.destroyPort(Number(portNum));
    }
  }


  async destroyPort(portNum: number) {
    await callPromised(this.instances[portNum][ItemPostion.serialPort].close);
    // TODO: remove handlers???
    this.instances[portNum][ItemPostion.events].destroy();
    delete this.instances[portNum];
  }

  async onData(portNum: number, handler: (data: string | Uint8Array) => void): Promise<number> {
    return this.getItem(portNum)[ItemPostion.events].addListener(SerialEvents.data, handler);
  }

  async onError(portNum: number, handler: (err: string) => void): Promise<number> {
    return this.getItem(portNum)[ItemPostion.events].addListener(SerialEvents.error, handler);
  }

  async write(portNum: number, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, data, ENCODE);
    }
    // binary
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, Buffer.from(data));
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
    if (!this.instances[portNum]) {
      throw new Error(`Serial IO: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }

  private async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem> {
    const params: SerialParams = {
      ...defaultSerialParams,
      ...portParams[portNum],
      ...paramsOverride,
    };

    if (!params.dev) {
      throw new Error(
        `Params of serial port ${portNum} has to have a "dev" parameter ` +
        `which points to serial device`
      );
    }

    const options: OpenOptions = omitObj(params, 'dev', 'rxPin', 'txPin');
    const serialPort: SerialPort = await this.createConnection(params.dev, options);
    const events = new IndexedEventEmitter<AnyHandler>();

    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(portNum, data));
    serialPort.on('error', (err) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

  private async createConnection(dev: string, options: OpenOptions): Promise<SerialPort> {
    return new Promise<SerialPort>((resolve, reject) => {
      const serialPort: SerialPort = new SerialPort(dev, options);

      let openTimeout: any;
      let errorHandler: any;
      let openHandler: any;

      errorHandler = (err: {message: string}) => {
        clearTimeout(openTimeout);
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        reject(err.message);
      };
      openHandler = () => {
        clearTimeout(openTimeout);
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        resolve(serialPort);
      };

      serialPort.on('error', errorHandler);
      serialPort.on('open', openHandler);

      openTimeout = setTimeout(() => {
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        reject(`Serial IO: timeout of opening a serial port has been exceeded`);
      }, SERVER_STARTING_TIMEOUT_SEC * 1000);
    });
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

  private resolvePortNum(portNum: number | undefined): number {
    if (typeof portNum === 'number') return portNum;

    unnamedPortNumIndex++;

    return unnamedPortNumIndex;
  }

}
