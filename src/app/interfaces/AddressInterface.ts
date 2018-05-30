export default interface Address {
  // unique path to remote host specified in config, like - bedroom.host1
  hostId: string;
  // type of connection - i2c, modbus, xbee, ble5 etc
  type: string;
  // bus which is used to connect if needed. For example on raspberry i2c uses bus 1. Undefined if doesn't need.
  bus: string;
  // address of remote host
  address: string;
}
