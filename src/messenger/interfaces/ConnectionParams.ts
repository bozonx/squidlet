export default interface ConnectionParams {
  // TODO: type и bus может объединить ???
  // type of connection - i2c, modbus, xbee, ble5 etc
  type: string;
  // bus which is used to connect if needed. For example on raspberry i2c uses bus 1. Undefined if doesn't need.
  bus: string;
  // address of current host on this connection
  srcAddress: string;
}
