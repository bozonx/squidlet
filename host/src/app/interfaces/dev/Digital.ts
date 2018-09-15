type WatchHandler = () => void;


export default interface Digital {
  read(pin: number): Promise<boolean>;
  write(pin: number, valud: boolean): Promise<void>;
  watch(pin: number, handler: WatchHandler): void;
}
