import IoItem from '../IoItem';
import IoContext from '../IoContext';


export type BaudRate = 9600 | 14400 | 19200 | 38400 | 57600 | 115200 | 128000 | 256000;
export type SerialMessageHandler = (data: string | Uint8Array) => void;

export enum SerialEvents {
  data,
  error,
}


export interface SerialParams {
  // device name. It uses only if squidlet runs on OS. Like /dev/ttyUSB0
  dev?: string;
  // rx pin. Uses on micro-controller or Raspberry pi like boards.
  pinRX?: number;
  // tx pin. Uses on micro-controller or Raspberry pi like boards.
  pinTX?: number;
  // default is 9600
  baudRate?: BaudRate;
  // databits?: 7 | 8;                      // (default 8)How many data bits - 7 or 8
  // // T-O-D-O: не использовать null
  // parity?: null | 'none' | 'o' | 'odd' | 'e' | 'even'; // (default none) Parity bit
  // stopbits?: number;                     // (default 1) Number of stop bits to use
}

export interface SerialDefinition {
  // params of ports by portNum or port name
  ports: {[index: string]: SerialParams};
  // TODO: add default baudRate
}

// TODO: make wrapper with promises
// low level instance
export interface SerialPortLike {
  write(data: any, cb: (err: string) => void): void;
  write(data: any, encode: string, cb: (err: string) => void): void;
  close(cb: (err: string) => void): void;
  on(eventName: 'data', cb: (data: any) => void): void;
  on(eventName: 'error', cb: (err: {message: string}) => void): void;
}


export const defaultSerialParams: SerialParams = {
  baudRate: 9600
};

export const Methods = [
  'init',
  'configure',
  'destroy',

  //'newPort',
  'destroyPort',

  'onData',
  'onError',
  'removeListener',

  'write',
  'print',
  'println',
  //'read',
];


/**
 * Uart api
 * portNum - it's number of UART interface on specified platform
 */
export default interface SerialIo extends IoItem {
  /**
   * Pre define props of port.
   * These props will be used when the "newPort" method will be called.
   */
  init(ioManager: IoContext): Promise<void>;
  configure(definition: SerialDefinition): Promise<void>;
  destroy(): Promise<void>;

  // /**
  //  * Create a new port and wait while it opens.
  //  * If you don't specify a portNum then a new one will be created and this number will be returned.
  //  */
  // newPort(portNum: number | undefined, paramsOverride: SerialParams): Promise<number>;

  destroyPort(portNum: string | number): Promise<void>;

  onData(portNum: string | number, handler: SerialMessageHandler): Promise<number>;
  onError(portNum: string | number, handler: (err: string) => void): Promise<number>;
  removeListener(portNum: string | number, eventName: SerialEvents, handlerIndex: number): Promise<void>;

  // write binary data
  write(portNum: string | number, data: Uint8Array): Promise<void>;
  // Print to the serial port - without a line break
  print(portNum: string | number, data: string): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(portNum: string | number, data: string): Promise<void>;
  // /**
  //  * Return a string or binary data or undefined containing characters that have been received
  //  * @param portNum
  //  * @param length - The number of characters to read, or undefined/0 for all available
  //  */
  // read(portNum: string | number, length?: number): Promise<string | Uint8Array>;

}
