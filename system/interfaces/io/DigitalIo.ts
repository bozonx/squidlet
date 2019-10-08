export type ChangeHandler = (state: boolean) => void;
export type DigitalInputMode = 'input'
  | 'input_pullup'
  | 'input_pulldown';
export type DigitalPinMode = DigitalInputMode | 'output';
export type Edge = 'rising' | 'falling' | 'both';


export const Methods = [
  'read',
  'write',
  'getPinMode',
  'addListener',
  'removeListener',
  'removeAllListeners',
  'setupInput',
  'setupOutput',
  'getPinMode',
];


export default interface DigitalIo {
  /**
   * Setup pin as input
   * @param pin - pin number
   * @param inputMode - one of modes: input | input_pullup | input_pulldown | output
   * @param debounce - debounce time in ms. 0 or less = no debounce.
   * @param edge - Which value (0 or 1 or both) will rise an event. One of modes: rising | falling | both
   */
  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  setupOutput(pin: number, initialValue: boolean): Promise<void>;

  // output and input pins can be read
  read(pin: number): Promise<boolean>;
  // only for output pins
  write(pin: number, value: boolean): Promise<void>;
  getPinMode(pin: number): Promise<DigitalPinMode | undefined>;

  // only for input pins
  // Listen to change events
  addListener(pin: number, handler: ChangeHandler): Promise<number>;
  removeListener(id: number): Promise<void>;
  removeAllListeners(): Promise<void>;
}

// export interface DigitalDriverFactory {
//   generateUniqId?(props: any): string;
// }
