export type WatchHandler = (state: boolean) => void;
export type DigitalInputMode = 'input'
  | 'input_pullup'
  | 'input_pulldown';
export type DigitalPinMode = DigitalInputMode | 'output';
export type Edge = 'rising' | 'falling' | 'both';


export const Methods = [
  'read',
  'write',
  'setWatch',
  'clearWatch',
  'clearAllWatches',
  'setupInput',
  'setupOutput',
  'getPinMode',
];


interface DigitalBase {
  read(pin: number): Promise<boolean>;

  // only for output pins
  write(pin: number, value: boolean): Promise<void>;

  // only for input pins
  //setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number>;
  setWatch(pin: number, handler: WatchHandler): Promise<number>;
  clearWatch(id: number): Promise<void>;
  clearAllWatches(): Promise<void>;
}

export interface DigitalSubDriver extends DigitalBase {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  setupOutput(pin: number, initialValue: boolean): Promise<void>;
  // getPinMode isn't used
}

// Digital.dev
export default interface DigitalDev extends DigitalBase {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void>;
  setupOutput(pin: number, initialValue?: boolean): Promise<void>;
  getPinMode(pin: number): Promise<DigitalPinMode | undefined>;
}
