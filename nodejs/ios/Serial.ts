import * as SerialPort from 'serialport';

import {textToUint8Array} from 'system/lib/serialize';
import SerialIo, {
  BaudRate,
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams
} from 'system/interfaces/io/SerialIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';


type SerialItem = [
  SerialPort,
  IndexedEventEmitter<AnyHandler>
];

enum ItemPostion {
  serialPort,
  events,
}

let portsParams: {[index: string]: SerialParams} = {};


export default class Serial implements SerialIo {
  private readonly instances: {[index: string]: SerialItem} = {};


  async configure(definition: SerialDefinition) {
    const result: {[index: string]: SerialParams} = {};

    for (let portNum of Object.keys(definition.ports)) {
      result[portNum] = {
        ...defaultSerialParams,
        ...definition.ports[portNum],
      };
    }

    portsParams = result;
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

  async onBinData(portNum: number, handler: (data: Uint8Array) => void): Promise<number> {

    // TODO: convert event name if need
    // TODO: если open и serial был уже открыт то сразу поднять событие

    this.getItem(portNum).on(eventsName, handler);

    // TODO: return index

    return 0;
  }

  async onStringData(portNum: number, handler: (data: string) => void): Promise<number> {
    // TODO: rise dataString - data as string
  }

  async onError(portNum: number, handler: (err: string) => void): Promise<number> {
    return this.getItem(portNum)[ItemPostion.events].addListener(SerialEvents.error, handler);
  }

  // TODO: add
  // async onOpen(portNum: number, handler: () => void): Promise<number> {
  //
  // }


  async write(portNum: number, data: Uint8Array): Promise<void> {
    let value: Buffer;

    if (typeof data === 'object' && (data as any).data && (data as any).count) {
      // TODO: взять только заданную длинну или просто проверить что данные нужно длинны ???
      value = Buffer.from(data as any);
    }
    else {
      value = Buffer.from(data as any);
    }

    // TODO: use async varsion
    this.getItem(portNum)[ItemPostion.serialPort].write(value);
  }

  async print(portNum: number, data: string): Promise<void> {
    this.getItem(portNum)[ItemPostion.serialPort].write(data);
  }

  async println(portNum: number, data: string): Promise<void> {
    this.getItem(portNum)[ItemPostion.serialPort].write(`${data}\r\n`);
  }

  async read(portNum: number, length?: number): Promise<Uint8Array> {
    const result: string | Buffer | null = this.getItem(portNum)[ItemPostion.serialPort].read(length);

    if (result === null) {
      return new Uint8Array(0);
    }
    else if (typeof result === 'string') {

      // TODO: review

      return textToUint8Array(result);
    }
    else if (Buffer.isBuffer(result)) {
      return convertBufferToUint8Array(result as Buffer);
    }
    else {
      throw new Error(`Unknown type of returned value "${JSON.stringify(result)}"`);
    }
  }

  async removeListener(portNum: number, eventName: SerialEvents, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPostion.events].removeListener(eventName, handlerIndex);
  }


  private handleIncomeData(portNum: number, data: string | Buffer) {
    // TODO: определить что это
    // TODO: если string - то отправить в событие string
    // TODO: если buffer - то преобразовать в Uint8
  }


  private getItem(portNum: number): SerialItem {
    if (!this.instances[portNum]) {
      throw new Error(`You have to do setup before acting with serial`);
    }

    return this.instances[portNum];
  }

  private async makeInstance(portNum: number, baudRate?: BaudRate, options?: Options): Promise<void> {
    // TODO: config undefined - use defaults
    let portOptions: {[index: string]: any} = {
      baudRate,
    };

    if (options) {
      portOptions = {
        ...portOptions,
        databits: options.bytesize,
        // TODO: какие значения принимает ???
        parity: options.parity,
        stopbits: options.stopbits,
      };
    }

    // TODO: !!!!!!! make platform specific - support /dev/ttyUSB0
    const uartName: string = `/dev/serial${portNum}`;
    const serialPort: SerialPort = new SerialPort(uartName, portOptions);
    const events = new IndexedEventEmitter<AnyHandler>();
    const item: SerialItem = [
      serialPort,
      events
    ];

    // TODO: может ли быть undefined????
    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(portNum, data));
    serialPort.on('error', (err) => {
      events.emit(SerialEvents.error, err.message);
    });

    this.instances[portNum] = item;
  }

}
