import SerialIo, {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams,
  SerialPortLike
} from '../../interfaces/io/SerialIo';
import {ENCODE} from '../constants';
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
  private instances: Record<string, SerialItem> = {};

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
    if (!this.definition) {
      throw new Error(`No serial port definitions`);
    }

    const promises: Promise<void>[] = [];

    for (let portNum in this.definition.ports) {
      promises.push(
        this.makePortItem(portNum, this.definition.ports[portNum])
          .then((item: SerialItem) => {
            this.instances[portNum] = item;
          })
      );
    }

    return Promise.all(promises).then();
  }

  async configure(definition: SerialDefinition) {
    this.definition = definition;
  }

  async destroy() {
    for (let portNum in this.instances) {
      await this.destroyPort(Number(portNum));
    }

    delete this.instances;
  }

  async destroyPort(portNum: number | string) {
    // TODO: reivew
    await this.instances[portNum][ItemPosition.serialPort].close();
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
    await this.getItem(portNum)[ItemPosition.serialPort].write(this.prepareBinaryDataToWrite(data));
  }

  async print(portNum: number | string, data: string): Promise<void> {
    await this.getItem(portNum)[ItemPosition.serialPort].write(data, ENCODE);
  }

  async println(portNum: number | string, data: string): Promise<void> {
    await this.getItem(portNum)[ItemPosition.serialPort].write(`${data}\n`, ENCODE);
  }


  // TODO: review
  protected async makePortItem(portNum: string, params: SerialParams): Promise<SerialItem> {
    const combinedParams: SerialParams = {
      ...defaultSerialParams,
      ...params,
    };

    const serialPort: SerialPortLike = await this.createConnection(portNum, combinedParams);
    const events = new IndexedEventEmitter<DefaultHandler>();

    // TODO: может лучше чтобы он сам эмитил?
    // TODO: лучше сюда перенести open timeout

    serialPort.on('data', (data: any) => this.handleIncomeData(portNum, data));
    // TODO: скорее всего err другой
    serialPort.on('error', (err: {message: string}) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

  protected getItem(portNum: number | string): SerialItem {
    if (!this.instances[portNum]) {
      throw new Error(`Serial IO: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }

  // TODO: review
  protected handleIncomeData(portNum: number, data: any) {
    const parsedData: string | Uint8Array = this.parseIncomeData(data);

    this.getItem(portNum)[ItemPosition.events].emit(SerialEvents.data, parsedData);
  }

  // TODO: review
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

}


// async read(portNum: number, length?: number): Promise<string | Uint8Array> {
//   const result: string | Buffer | null = this.getItem(portNum)[ItemPosition.serialPort].read(length);
//
//   return this.parseIncomeData(result);
// }

// protected resolvePortNum(portNum: number | undefined): number {
//   if (typeof portNum === 'number') return portNum;
//
//   unnamedPortNumIndex++;
//
//   return unnamedPortNumIndex;
// }
