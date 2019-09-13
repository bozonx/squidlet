import * as SerialPort from 'serialport';

import {textToUint8Array} from 'system/lib/serialize';
import SerialIo, {
  BaudRate,
  defaultSerialParams,
  Options,
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

let portsParams: (SerialParams)[] = [];


export default class Serial implements SerialIo {
  private readonly instances: SerialItem[] = [];


  async configure(definition: SerialDefinition) {
    const result : SerialParams[]= [];

    for (let item of definition.ports) {
      //if (typeof item === 'undefined') result.push(undefined);

      result.push({
        ...defaultSerialParams,
        ...item,
      });
    }

    portsParams = result;
  }

  async destroy() {
    // TODO: проверить чтобы когда драйвер дестроится - то события должны отписаться
  }



  async destroyPort(uartNum: number) {
    // TODO: remove listeners
  }


  async onBinData(uartNum: number, handler: (data: Uint8Array) => void): Promise<number> {

    // TODO: convert event name if need
    // TODO: если open и serial был уже открыт то сразу поднять событие

    this.getSerial(uartNum).on(eventsName, handler);

    // TODO: return index

    return 0;
  }

  async onStringData(uartNum: number, handler: (data: string) => void): Promise<number> {
    // TODO: rise dataString - data as string
  }

  async onError(uartNum: number, handler: (err: string) => void): Promise<number> {
    // TODO: listen to errors
  }

  // async onOpen(uartNum: number, handler: () => void): Promise<number> {
  //
  // }


  async write(uartNum: number, data: Uint8Array): Promise<void> {
    let value: Buffer;

    if (typeof data === 'object' && (data as any).data && (data as any).count) {
      // TODO: взять только заданную длинну или просто проверить что данные нужно длинны ???
      value = Buffer.from(data as any);
    }
    else {
      value = Buffer.from(data as any);
    }

    this.getSerial(uartNum).write(value);
  }

  async print(uartNum: number, data: string): Promise<void> {
    this.getSerial(uartNum).write(data);
  }

  async println(uartNum: number, data: string): Promise<void> {
    this.getSerial(uartNum).write(`${data}\r\n`);
  }

  async read(uartNum: number, length?: number): Promise<Uint8Array> {
    const result: string | Buffer | null = this.getSerial(uartNum).read(length);

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

  async removeListener(eventName: SerialEvents, handlerIndex: number): Promise<void> {
    // TODO: add
  }


  private getSerial(uartNum: number): SerialPort {
    if (!this.instances[uartNum]) {
      throw new Error(`You have to do setup before acting with serial`);
    }

    return this.instances[uartNum];
  }

  private handleIncomeData(uartNum: string, data: string | Buffer) {
    // TODO: определить что это
    // TODO: если string - то отправить в событие string
    // TODO: если buffer - то преобразовать в Uint8
  }


  private async makeInstance(uartNum: number, baudRate?: BaudRate, options?: Options): Promise<void> {
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
    const uartName: string = `/dev/serial${uartNum}`;
    const serialPort: SerialPort = new SerialPort(uartName, portOptions);
    const events = new IndexedEventEmitter<AnyHandler>();
    const item: SerialItem = [
      serialPort,
      events
    ];

    // TODO: может ли быть undefined????
    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(uartNum, data));
    serialPort.on('error', (err) => {
      events.emit(SerialEvents.error, err.message);
    });

    this.instances[uartNum] = item;
  }

}
