import * as SerialPort from 'serialport';

import SerialFactory, {Serial, BaudRate, Options, EventName} from '../../../host/src/app/interfaces/dev/Serial';


interface RpiOptions extends Options {
  // TODO: review
}


class SerialDev implements Serial {
  private readonly uartDev: string;

  get serial(): any {

    // TODO: вернеть serial

    //return (global as any)[this.uartName];
  }

  constructor(uartDev: string) {
    this.uartDev = uartDev;
  }

  on(eventsName: EventName, handler: (...params: any[]) => void): void {
    this.serial.on(eventsName, handler);
  }

  async print(data: string): Promise<void> {
    this.serial.print(data);
  }

  async println(data: string): Promise<void> {
    this.serial.println(data);
  }

  async read(chars?: number): Promise<string> {
    return this.serial.read(chars);
  }

  setup(baudrate?: BaudRate, options?: RpiOptions): void {
    this.serial.setup(baudrate, options);
  }

  async write(data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void> {
    return this.serial.write(data);
  }

}

const serialFactory: SerialFactory = (uartDev: string): SerialDev => {
  return new SerialDev(uartDev);
};

export default serialFactory;

