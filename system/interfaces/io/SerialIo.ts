import IoItem from '../IoItem';


export type BaudRate = 9600 | 14400 | 19200 | 38400 | 57600 | 115200 | 128000 | 256000;
// export type EventName = 'data'
//   | 'dataString'
//   | 'error'
// //  | 'open'
// ;

export enum SerialEvents {
  data,
  dataString,
  error,
}


export interface Options {
  bytesize?: 7 | 8;                      // (default 8)How many data bits - 7 or 8
  // TODO: не использовать null
  parity?: null | 'none' | 'o' | 'odd' | 'e' | 'even'; // (default none) Parity bit
  stopbits?: number;                     // (default 1) Number of stop bits to use
}


export const Methods = [
  'setup',
  'destroyPort',
  'onBinData',
  'onStringData',
  'onError',
  //'onOpen',
  'write',
  'print',
  'println',
  'read',
  'removeListener',
];


/**
 * Uart api
 * uartNum - it's number of UART interface on specified platform
 */
export default interface SerialIo extends IoItem {
  /**
   * Setup serial
   * @param uartNum
   * @param baudRate - default is 9600
   * @param options
   */
  setup(uartNum: number, baudRate?: BaudRate, options?: Options): Promise<void>;
  destroyPort(uartNum: number): Promise<void>;

  onBinData(uartNum: number, handler: (data: Uint8Array) => void): Promise<number>;
  onStringData(uartNum: number, handler: (data: string) => void): Promise<number>;
  onError(uartNum: number, handler: (err: string) => void): Promise<number>;
  // It rises on Serial initialization event or immediately if serial is initialized
  //onOpen(uartNum: number, handler: () => void): Promise<number>;

  // write binary data
  write(uartNum: number, data: Uint8Array): Promise<void>;
  // Print to the serial port - without a line break
  print(uartNum: number, data: string): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(uartNum: number, data: string): Promise<void>;

  /**
   * Return a string containing characters that have been received
   * @param uartNum
   * @param length - The number of characters to read, or undefined/0 for all available
   */
  read(uartNum: number, length?: number): Promise<Uint8Array>;

  removeListener(eventName: SerialEvents, handlerIndex: number): Promise<void>;
}
