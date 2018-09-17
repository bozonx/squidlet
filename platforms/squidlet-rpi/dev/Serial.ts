import * as SerialPort from 'serialport';

import Serial, {BaudRate, Options, EventName} from '../../../host/src/app/interfaces/dev/Serial';


interface RpiOptions extends Options {
  // TODO: review
}


class SerialDev implements Serial {
  private readonly instances: {[index: string]: any};

  getSerial(uartName: string): any {
    return this.instances[uartName];
  }

  on(uartName: string, eventsName: EventName, handler: (...params: any[]) => void): void {
    this.serial.on(eventsName, handler);
  }

  async print(uartName: string, data: string): Promise<void> {
    this.serial.print(data);
  }

  async println(uartName: string, data: string): Promise<void> {
    this.serial.println(data);
  }

  async read(uartName: string, chars?: number): Promise<string> {
    return this.serial.read(chars);
  }

  setup(uartName: string, baudRate?: BaudRate, options?: RpiOptions): void {
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
    return this.serial.write(data);
  }

}

export default new SerialDev();
