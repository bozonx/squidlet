export default interface GpioDigitalDriver {
  getLevel(pin: number): Promise<boolean>;
}
