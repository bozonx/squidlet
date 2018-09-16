export type BaudRate = 9600 | 14400 | 19200 | 38400 | 57600 | 115200 | 128000 | 256000;
export type EventName = 'data' | 'framing' | 'parity';


export interface Options {
  bytesize?: 7 | 8;                      // (default 8)How many data bits - 7 or 8
  parity?: null | 'none' | 'o' | 'odd' | 'e' | 'even'; // (default none) Parity bit
  stopbits?: number;                     // (default 1) Number of stop bits to use
}


export interface Serial {
  on(eventsName: 'data', handler: (data: string | Uint8Array) => void): void;
  on(eventsName: EventName, handler: () => void): void;

  // TODO: add error event - framing и parity - наверное это и есть ошибки???

  // Print a string to the serial port - without a line feed
  print(data: string): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(data: string): Promise<void>;

  /**
   * Return a string containing characters that have been received
   * @param chars - The number of characters to read, or undefined/0 for all available
   */
  read(chars?: number): Promise<string>;

  /**
   * Setup serial
   * @param baudrate - default is 9600
   * @param options
   */
  setup(baudrate?: BaudRate, options?: Options): void;

  // write a binary data
  write(data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void>;

  // TODO: is ti need to add? : find, inject, pipe, setConsole
}

// uart - it's platform specific name or dev name on linux
type SerialFactory = (uart: any) => Serial;

export default SerialFactory;
