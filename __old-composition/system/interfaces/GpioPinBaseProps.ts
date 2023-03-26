export default interface GpioPinBaseProps {
  pin: number;
  // Virtual IO set which will be used. By default the system's is used.
  ioSet?: string;
}
