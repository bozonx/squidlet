export type WatchHandler = (state: boolean) => void;
// pin modes like on espruino
export type PinMode = 'input'
  | 'input_pullup'
  | 'input_pulldown'
  | 'output';
export type Edge = 'rising' | 'falling' | 'both';


export default interface Digital {
  setup(pin: number, pinMode: PinMode): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number;
  clearWatch(id: number): void;
  clearAllWatches(): void;
}
