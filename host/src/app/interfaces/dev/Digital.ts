export type WatchHandler = (state: boolean) => void;
export type DigitalInputMode = 'input'
  | 'input_pullup'
  | 'input_pulldown';
export type DigitalPinMode = DigitalInputMode | 'output';
export type Edge = 'rising' | 'falling' | 'both';


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

// Digital.dev
export interface Digital extends DigitalBase {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void>;
  setupOutput(pin: number, outputInitialValue?: boolean): Promise<void>;
  getPinMode(pin: number): Promise<DigitalPinMode | undefined>;
}

export interface DigitalSubDriver extends DigitalBase {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  setupOutput(pin: number, outputInitialValue: boolean): Promise<void>;
  // getPinMode isn't used
}
