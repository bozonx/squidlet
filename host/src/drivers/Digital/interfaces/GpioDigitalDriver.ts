export type GpioDigitalDriverHandler = (level: boolean) => void;


export default interface GpioDigitalDriver {
  getLevel(pin: number): Promise<boolean>;
  // only for output pin
  setLevel(pin: number, level: boolean): Promise<void>;
  // only for input pin
  addListener(handler: GpioDigitalDriverHandler): void;
  // only for input pin
  removeListener(handler: GpioDigitalDriverHandler): void;
}
