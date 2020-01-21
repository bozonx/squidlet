import SerialIo, {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams,
  SerialPortLike
} from '../../interfaces/io/SerialIo';
import {ENCODE} from '../constants';
import {callPromised} from '../common';
import IndexedEventEmitter, {DefaultHandler} from '../IndexedEventEmitter';
import IoContext from '../../interfaces/IoContext';


export type SerialItem = [
  SerialPortLike,
  IndexedEventEmitter<DefaultHandler>
];

export enum ItemPosition {
  serialPort,
  events,
}

let unnamedPortNumIndex = 0;


export default abstract class SerialIoBase implements SerialIo {
  protected definition?: SerialDefinition;
  // TODO: review
  private readonly instances: {[index: string]: SerialItem} = {};

  // TODO: add open connection promise


  // TODO: review - maybe use serial instance wrapper
  protected abstract createConnection(portNum: number | string, params: SerialParams): Promise<SerialPortLike>;

  // TODO: review - maybe use serial instance wrapper
  /**
   * Convert binary data which will be written.
   */
  protected abstract prepareBinaryDataToWrite(data: Uint8Array): any;

  // TODO: review - maybe use serial instance wrapper
  /**
   * Convert binary data which is received from bus.
   */
  protected abstract convertIncomeBinaryData(data: any): Uint8Array;


  async init(ioContext: IoContext): Promise<void> {
  }

  async configure(definition: SerialDefinition) {
    this.definition = definition;
  }

  // async newPort(portNum: number | undefined, paramsOverride: SerialParams): Promise<number> {
  //   const resolvedPortNum = this.resolvePortNum(portNum);
  //
  //   if (!this.instances[resolvedPortNum]) {
  //     this.instances[resolvedPortNum] = await this.makePortItem(resolvedPortNum, paramsOverride);
  //   }
  //
  //   return resolvedPortNum;
  // }

  async destroy() {
    // TODO: reivew
    for (let portNum of Object.keys(this.instances)) {
      this.destroyPort(Number(portNum));
    }
  }

  async destroyPort(portNum: number | string) {
    // TODO: reivew
    // TODO: а он есть ????
    await callPromised(this.instances[portNum][ItemPosition.serialPort].close);
    // TODO: remove handlers???
    this.instances[portNum][ItemPosition.events].destroy();
    delete this.instances[portNum];
  }

  async onData(portNum: number | string, handler: (data: string | Uint8Array) => void): Promise<number> {
    return this.getItem(portNum)[ItemPosition.events].addListener(SerialEvents.data, handler);
  }

  async onError(portNum: number | string, handler: (err: string) => void): Promise<number> {
    return this.getItem(portNum)[ItemPosition.events].addListener(SerialEvents.error, handler);
  }

  async removeListener(portNum: number | string, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPosition.events].removeListener(handlerIndex);
  }

  async write(portNum: number | string, data: Uint8Array): Promise<void> {
    await callPromised(
      this.getItem(portNum)[ItemPosition.serialPort].write,
      this.prepareBinaryDataToWrite(data)
    );
  }

  async print(portNum: number | string, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPosition.serialPort].write, data, ENCODE);
  }

  async println(portNum: number | string, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPosition.serialPort].write, `${data}\n`, ENCODE);
  }

  // async read(portNum: number, length?: number): Promise<string | Uint8Array> {
  //   const result: string | Buffer | null = this.getItem(portNum)[ItemPosition.serialPort].read(length);
  //
  //   return this.parseIncomeData(result);
  // }


  // protected getPreDefinedPortParams(): {[index: string]: SerialParams} {
  //   return preDefinedPortsParams;
  // }

  protected resolvePortNum(portNum: number | undefined): number {
    if (typeof portNum === 'number') return portNum;

    unnamedPortNumIndex++;

    return unnamedPortNumIndex;
  }

  // TODO: review
  protected getItem(portNum: number | string): SerialItem {
    if (!this.instances[portNum]) {
      throw new Error(`Serial IO: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }

  protected handleIncomeData(portNum: number, data: any) {
    const parsedData: string | Uint8Array = this.parseIncomeData(data);

    this.getItem(portNum)[ItemPosition.events].emit(SerialEvents.data, parsedData);
  }

  protected parseIncomeData(data: any): string | Uint8Array {
    if (!data) {
      return '';
    }
    else if (typeof data === 'string') {
      //return utf8TextToUint8Array(data);

      return data;
    }

    return this.convertIncomeBinaryData(data);
  }

  protected async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem> {
    const params: SerialParams = {
      ...defaultSerialParams,
      // TODO: review
      //...this.getPreDefinedPortParams()[portNum],
      ...paramsOverride,
    };

    const serialPort: SerialPortLike = await this.createConnection(portNum, params);
    const events = new IndexedEventEmitter<DefaultHandler>();

    serialPort.on('data', (data: any) => this.handleIncomeData(portNum, data));
    // TODO: скорее всего err другой
    serialPort.on('error', (err: {message: string}) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

}
