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
 * uartNum - it's number of UART interface on specified platform
 */
export default interface Serial {
  on(uartNum: number, eventsName: 'data', handler: (data: Uint8Array) => void): void;

  // TODO: add error event - framing и parity - наверное это и есть ошибки???
  // TODO: add open event

  on(uartNum: number, eventsName: EventName, handler: () => void): void;


  // Print to the serial port - without a line feed
  print(uartNum: number, data: Uint8Array): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(uartNum: number, data: string): Promise<void>;

  /**
   * Return a string containing characters that have been received
   * @param chars - The number of characters to read, or undefined/0 for all available
   */
  read(uartNum: number, chars?: number): Promise<Uint8Array>;

  /**
   * Setup serial
   * @param baudrate - default is 9600
   * @param options
   */
  setup(uartNum: number, baudRate?: BaudRate, options?: Options): void;

  // write a binary data
  write(uartNum: number, data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void>;

  // TODO: Is it need to add? : find, inject, pipe, setConsole
}
