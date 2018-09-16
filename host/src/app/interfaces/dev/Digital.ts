export type WatchHandler = () => void;
// pin modes like on espruino
export type PinMode = 'input'
  | 'input_pullup'
  | 'input_pulldown'
  | 'output';


// TODO: в digitalWrite - можно делать pulse если передать несколько значений

export default interface Digital {
  setup(pin: number, pinMode: PinMode): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  watch(pin: number, handler: WatchHandler): void;
}
