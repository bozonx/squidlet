export default interface GpioPinBaseProps {
  pin: number;
  // GPIO device which will be used. By default the local device "gpio" is used.
  gpio: string;
}
