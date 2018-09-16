type WatchHandler = () => void;


export default interface Digital {
  setup(pin: number): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  watch(pin: number, handler: WatchHandler): void;
}
