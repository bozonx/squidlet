// parsed manifest of device
export default interface DriverManifest {
  // name of driver e.g. "GpioInput.driver"
  name: string;
  // path to device main file
  main: string;
  // generic type of device
  type: string;
  // drivers dependencies - list of drivers names which is used in this driver
  drivers?: string[];
  // it's actually default driver config
  props?: {[index: string]: any};
}
