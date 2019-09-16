import {defaultSerialParams, SerialDefinition, SerialEvents, SerialParams} from '../interfaces/io/SerialIo';
import {ENCODE} from '../constants';
import {callPromised} from '../lib/common';
import IndexedEventEmitter from '../lib/IndexedEventEmitter';
import {AnyHandler} from '../lib/IndexedEvents';
import {convertBufferToUint8Array} from '../lib/buffer';


export interface SerialPortLike {
  write(data: any, cb: (err: string) => void): void;
  write(data: any, encode: string, cb: (err: string) => void): void;
  close(cb: (err: string) => void): void;
  on(eventName: 'data', cb: (data: any) => void): void;
  on(eventName: 'error', cb: (err: {message: string}) => void): void;
}

export type SerialItem = [
  SerialPortLike,
  IndexedEventEmitter<AnyHandler>
];

export enum ItemPostion {
  serialPort,
  events,
}

let preDefinedPortsParams: {[index: string]: SerialParams} = {};
let unnamedPortNumIndex = 0;


export default abstract class SerialIoBase {
  private readonly instances: {[index: string]: SerialItem} = {};


  protected abstract createConnection(portNum: number, params: SerialParams): Promise<SerialPortLike>;


  async configure(newDefinition: SerialDefinition) {
    preDefinedPortsParams = newDefinition.ports;
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
    // TODO: а он есть ????
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

  async write(portNum: number, data: Uint8Array): Promise<void> {
    // TODO: сделать обертку для подготовки данных для отправки
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, Buffer.from(data));
  }

  async print(portNum: number, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, data, ENCODE);
  }

  async println(portNum: number, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, `${data}\n`, ENCODE);
  }

  // async read(portNum: number, length?: number): Promise<string | Uint8Array> {
  //   const result: string | Buffer | null = this.getItem(portNum)[ItemPostion.serialPort].read(length);
  //
  //   return this.parseIncomeData(result);
  // }

  async removeListener(portNum: number, eventName: SerialEvents, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPostion.events].removeListener(eventName, handlerIndex);
  }


  protected getPreDefinedPortParams(): {[index: string]: SerialParams} {
    return preDefinedPortsParams;
  }

  protected resolvePortNum(portNum: number | undefined): number {
    if (typeof portNum === 'number') return portNum;

    unnamedPortNumIndex++;

    return unnamedPortNumIndex;
  }

  protected getItem(portNum: number): SerialItem {
    if (!this.instances[portNum]) {
      throw new Error(`Serial IO: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }

  protected handleIncomeData(portNum: number, data: string | Buffer | null) {
    const parsedData: string | Uint8Array = this.parseIncomeData(data);

    this.getItem(portNum)[ItemPostion.events].emit(SerialEvents.data, parsedData);
  }

  protected parseIncomeData(data: string | Buffer | null): string | Uint8Array {
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

  protected async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem> {
    const params: SerialParams = {
      ...defaultSerialParams,
      ...this.getPreDefinedPortParams()[portNum],
      ...paramsOverride,
    };

    const serialPort: SerialPortLike = await this.createConnection(portNum, params);
    const events = new IndexedEventEmitter<AnyHandler>();

    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(portNum, data));
    // TODO: скорее всего err другой
    serialPort.on('error', (err: {message: string}) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

}
