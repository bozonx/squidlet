export default interface DeviceConf {
  // generic type of device
  type: string;
  // TODO: review
  // config of connections of device
  connections: Array<object>;
  // parameters of device which sets in config
  params: {[index: string]: any};
  // status of device if defined
  status?: {[index: string]: string};
}
