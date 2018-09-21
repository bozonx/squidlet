type GpioDigitalDriverHandler = (level: boolean) => void;


export default interface GpioDigitalDriver {
  getLevel(pin: number): Promise<boolean>;
  setLevel(pin: number, level: boolean): Promise<void>;
  addListener(): void;
}
