export default interface Destination {
  // type of connection - i2c, modbus, xbee, ble5 etc
  type: string;
  // bus which is used to connect if needed. For example on raspberry i2c uses bus 1. Undefined if doesn't need.
  // it's bus of current host
  bus: string;
  // address of remote host
  address: string;
}
