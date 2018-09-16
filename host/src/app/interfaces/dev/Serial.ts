// export const Serial1 = 1;
// export const Serial2 = 2;
// export const Serial3 = 3;

export type BaudRate = 9600 | 14400 | 19200 | 38400 | 57600 | 115200 | 128000 | 256000;


export interface Setup {
  rx?: number;                           // Receive pin (data in to Espruino)
  tx?: number;                           // Transmit pin (data out of Espruino)
  ck?: number;                           // (default none) Clock Pin
  cts?: number;                          // (default none) Clear to Send Pin
  bytesize?: 7 | 8;                      // (default 8)How many data bits - 7 or 8
  parity?: null | 'none' | 'o' | 'odd' | 'e' | 'even'; // (default none) Parity bit
  stopbits?: number;                     // (default 1) Number of stop bits to use
  flow?: null | undefined | 'none' | 'xon'; // (default none) software flow control
  path?: null | undefined | string;      // Linux Only - the path to the Serial device to use
  errors?: boolean;                      // (default false) whether to forward framing/parity errors
}


export enum Uarts {
  Bluetooth,
  LoopbackA,
  LoopbackB,
  Serial1,
  Serial2,
  Serial3,
  Serial4,
  Serial5,
  Serial6,
  Telnet,
  Terminal,
}


export default interface Serial {
  on(eventsName: 'data', handler: (data: string | Uint8Array) => void): void;
  on(eventsName: 'framing', handler: () => void): void;
  on(eventsName: 'parity', handler: () => void): void;
  // Print a string to the serial port - without a line feed
  print(data: string): Promise<void>;
  // Print a line to the serial port with a newline (\r\n) at the end of it.
  println(data: string): Promise<void>;

  /**
   * Return a string containing characters that have been received
   * @param chars - The number of characters to read, or undefined/0 for all available
   */
  read(chars?: number): Promise<string>;

  setup(uart: Uarts, baudrate: BaudRate, params: Setup): void;

  // TODO: add: find, inject, pipe, setConsole
}
