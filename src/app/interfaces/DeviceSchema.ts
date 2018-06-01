export default interface DeviceConf {
  // generic type of device
  type: string;
  // config of connections of device
  connections: Array;
  params: object;
  // status of device if exist
  status?: object;
}
