import Platforms from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import {AppType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';


export interface HostConfigConfig {
  // republish status silently every minute if it hasn't been changed
  //defaultStatusRepublishIntervalMs: number;
  // republish config silently every 10 minutes if it hasn't been changed
  //defaultConfigRepublishIntervalMs: number;
  // main timeout in seconds
  requestTimeoutSec: number;
  // timeout of waiting for connection has been establish
  connectionTimeoutSec: number;
  // resend timeout in seconds
  senderResendTimeout: number;
  // default response of remote call in seconds
  rcResponseTimoutSec: number;
  // general timeout for response for such interfaces as I2C, serial etc. Not for HTML.
  responseTimoutSec: number;
  // default timeout for jobs in queue
  queueJobTimeoutSec: number;
  // delay before rebooting a host in seconds
  rebootDelaySec: number;
  defaultTtl: number;

  reconnectTimes: number;
  reconnectTimeoutSec: number;

  // allow or disallow to switch app into IoServer and back. Default is false
  //appSwitchLock: boolean;
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
  appType: AppType;
  platform: Platforms;
  machine: string;
  //platform: Platforms;
  // specific config for each host
  config: HostConfigConfig;

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
