import {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams,
  SerialPortLike
} from '../interfaces/io/SerialIo';
import {ENCODE} from '../lib/constants';
import {callPromised} from '../lib/common';
import IndexedEventEmitter from '../lib/IndexedEventEmitter';
import {AnyHandler} from '../lib/IndexedEvents';


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

  /**
   * Convert binary data which will be written.
   */
  protected abstract prepareBinaryDataToWrite(data: Uint8Array): any;

  /**
   * Convert binary data which is received from bus.
   */
  protected abstract convertIncomeBinaryData(data: any): Uint8Array;


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
    await callPromised(
      this.getItem(portNum)[ItemPostion.serialPort].write,
      this.prepareBinaryDataToWrite(data)
    );
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

  async removeListener(portNum: number, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPostion.events].removeListener(handlerIndex);
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

  protected handleIncomeData(portNum: number, data: any) {
    const parsedData: string | Uint8Array = this.parseIncomeData(data);

    this.getItem(portNum)[ItemPostion.events].emit(SerialEvents.data, parsedData);
  }

  protected parseIncomeData(data: any): string | Uint8Array {
    if (!data) {
      return '';
    }
    else if (typeof data === 'string') {
      //return textToUint8Array(data);

      return data;
    }

    return this.convertIncomeBinaryData(data);
  }

  protected async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem> {
    const params: SerialParams = {
      ...defaultSerialParams,
      ...this.getPreDefinedPortParams()[portNum],
      ...paramsOverride,
    };

    const serialPort: SerialPortLike = await this.createConnection(portNum, params);
    const events = new IndexedEventEmitter<AnyHandler>();

    serialPort.on('data', (data: any) => this.handleIncomeData(portNum, data));
    // TODO: скорее всего err другой
    serialPort.on('error', (err: {message: string}) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

}
