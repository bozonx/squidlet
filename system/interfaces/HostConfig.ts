import Platforms from './Platforms';


export interface HostConfigConfig {
  //logLevel: LogLevel;
  // republish status silently every minute if it hasn't been changed
  //defaultStatusRepublishIntervalMs: number;
  // republish config silently every 10 minutes if it hasn't been changed
  //defaultConfigRepublishIntervalMs: number;
  // main timeout in seconds
  requestTimeoutSec: number;
  // resend timeout in seconds
  senderResendTimeout: number;
  // default response of remote call in seconds
  rcResponseTimoutSec: number;
  // default timeout for jobs in queue
  queueJobTimeoutSec: number;
  // delay before rebooting a host in seconds
  rebootDelaySec: number;

  // custom params
  //params: {[index: string]: any};

  // network: {
  //   routedMessageTTL: number;
  //   requestTimeout: number;
  // };

  // drivers: {
  //   // debounce of digital input in ms
  //   //defaultDigitalPinInputDebounce: number;
  //   // default poll interval for master-slave connections
  //   //defaultPollInterval: number;
  // };
}


export default interface HostConfig {
  // id of host e.g master
  id: string;
  platform: Platforms;
  machine: string;
  //platform: Platforms;
  // specific config for each host
  config: HostConfigConfig;

  // host and port to listen to in IO server mode.
  // it will use default values if this param is en empty object.
  ioServer?: {
    // default is localhost
    host: string;
    // default is 8089
    port: number;
  };

  // // TODO: remove
  // address: Destination;
  //
  // connections: Array<MyAddress>;
  // // addresses of the nearest neighbors hosts
  // neighbors: {[index: string]: Destination};
  // // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  // routes: {[index: string]: Array<string>};
  // // TODO: сделать линки и координаторы
  // links: object;
}
