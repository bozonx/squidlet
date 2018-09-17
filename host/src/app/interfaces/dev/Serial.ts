export type BaudRate = 9600 | 14400 | 19200 | 38400 | 57600 | 115200 | 128000 | 256000;
export type EventName = 'data' | 'framing' | 'parity';


export interface Options {
  bytesize?: 7 | 8;                      // (default 8)How many data bits - 7 or 8
  parity?: null | 'none' | 'o' | 'odd' | 'e' | 'even'; // (default none) Parity bit
  stopbits?: number;                     // (default 1) Number of stop bits to use
  // TODO: add echo             Print characters as you type them
}


/**
 * Uart api
 * uartName - it's platform specific name or dev name on linux
 */
export default interface Serial {
  on(uartName: string, eventsName: 'data', handler: (data: string | Uint8Array) => void): void;

  // TODO: add error event - framing и parity - наверное это и есть ошибки???
  // TODO: add open event

  on(uartName: string, eventsName: EventName, handler: () => void): void;


  // Print a string to the serial port - without a line feed
  print(uartName: string, data: string): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(uartName: string, data: string): Promise<void>;

  /**
   * Return a string containing characters that have been received
   * @param chars - The number of characters to read, or undefined/0 for all available
   */
  read(uartName: string, chars?: number): Promise<string>;

  /**
   * Setup serial
   * @param baudrate - default is 9600
   * @param options
   */
  setup(uartName: string, baudRate?: BaudRate, options?: Options): void;

  // write a binary data
  write(uartName: string, data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void>;

  // TODO: Is it need to add? : find, inject, pipe, setConsole
}
