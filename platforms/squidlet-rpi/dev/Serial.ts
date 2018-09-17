import * as SerialPort from 'serialport';

import Serial, {BaudRate, Options, EventName} from '../../../host/src/app/interfaces/dev/Serial';


export default class SerialDev implements Serial {
  private readonly instances: {[index: string]: SerialPort} = {};

  on(uartName: string, eventsName: EventName, handler: (...params: any[]) => void): void {

    // TODO: convert event name if need

    this.getSerial(uartName).on(eventsName, handler);
  }

  async print(uartName: string, data: string): Promise<void> {
    this.getSerial(uartName).write(data);
  }

  async println(uartName: string, data: string): Promise<void> {
    this.getSerial(uartName).write(`${data}\r\n`);
  }

  async read(uartName: string, chars?: number): Promise<string> {
    const result: string | Buffer | null = this.getSerial(uartName).read(chars);

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

  setup(uartName: string, baudRate?: BaudRate, options?: Options): void {
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

    this.instances[uartName] = new SerialPort(uartName, portOptions);
  }

  async write(uartName: string, data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void> {
    let value: Buffer;

    if (typeof data === 'object' && (data as any).data && (data as any).count) {
      // TODO: взять только заданную длинну или просто проверить что данные нужно длинны ???
      value = Buffer.from(data as any[]);
    }
    else {
      value = Buffer.from(data as any[]);
    }

    this.getSerial(uartName).write(value);
  }


  private getSerial(uartName: string): SerialPort {
    if (!this.instances[uartName]) {
      throw new Error(`You have to do setup before acting with serial`);
    }

    return this.instances[uartName];
  }

}
