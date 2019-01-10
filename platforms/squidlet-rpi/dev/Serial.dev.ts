import * as SerialPort from 'serialport';

import Serial, {BaudRate, Options, EventName} from '../../../host/src/app/interfaces/dev/Serial';


export default class SerialDev implements Serial {
  private readonly instances: SerialPort[] = [];

  // TODO: rise dataString - data as string
  // TODO: listen to errors

  on(uartNum: number, eventsName: EventName, handler: (...params: any[]) => void): void {

    // TODO: convert event name if need
    // TODO: если open и serial был уже открыт то сразу поднять событие

    this.getSerial(uartNum).on(eventsName, handler);
  }


  async write(uartNum: number, data: Uint8Array): Promise<void> {
    let value: Buffer;

    if (typeof data === 'object' && (data as any).data && (data as any).count) {
      // TODO: взять только заданную длинну или просто проверить что данные нужно длинны ???
      value = Buffer.from(data as any[]);
    }
    else {
      value = Buffer.from(data as any[]);
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

    // TODO: review - return Uint8Array

    const result: string | Buffer | null = this.getSerial(uartNum).read(length);

    if (result === null) {
      return '';
    }
    else if (typeof result === 'string') {
      return result;
    }
    else if (Buffer.isBuffer(result)) {
      return (result as Buffer).toString();
    }
    else {
      throw new Error(`Unknown type of returned value "${JSON.stringify(result)}"`);
    }
  }

  setup(uartNum: number, baudRate?: BaudRate, options?: Options): void {
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

    // TODO: make uartName
    // TODO: rise open error

    this.instances[uartNum] = new SerialPort(uartName, portOptions);
  }

  removeListener(handlerIndex: number): void {
    // TODO: add
  }


  private getSerial(uartNum: number): SerialPort {
    if (!this.instances[uartNum]) {
      throw new Error(`You have to do setup before acting with serial`);
    }

    return this.instances[uartNum];
  }

}
