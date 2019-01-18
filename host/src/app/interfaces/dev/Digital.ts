export type WatchHandler = (state: boolean) => void;
export type DigitalInputMode = 'input'
  | 'input_pullup'
  | 'input_pulldown';
export type DigitalPinMode = DigitalInputMode | 'output';
export type Edge = 'rising' | 'falling' | 'both';


// Digital.dev
export interface Digital {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void>;
  setupOutput(pin: number, outputInitialValue?: boolean): Promise<void>;
  getPinMode(pin: number): Promise<DigitalPinMode | undefined>;
  read(pin: number): Promise<boolean>;

  // only for output pins
  write(pin: number, value: boolean): Promise<void>;

  // only for input pins
  //setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number>;
  setWatch(pin: number, handler: WatchHandler): Promise<number>;
  clearWatch(id: number): Promise<void>;
  clearAllWatches(): Promise<void>;
}

export interface DigitalSubDriver extends Digital {
  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  setupOutput(pin: number, outputInitialValue: boolean): Promise<void>;
}
