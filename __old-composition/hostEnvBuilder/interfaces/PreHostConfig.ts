import {IoDefinitions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';


// export interface IoSetConfig {
//   type: IoSetTypes;
//   // other platforms set params
//   [index: string]: any;
// }

export interface PreHostConfigConfig {
  // republish status silently every minute if it hasn't been changed
  //defaultStatusRepublishIntervalMs?: number;
  // republish config silently every 10 minutes if it hasn't been changed
  //defaultConfigRepublishIntervalMs?: number;
  // timeout of waiting for connection has been establish
  connectionTimeoutSec?: number;
  // timeout for common requests in seconds
  requestTimeoutSec?: number;
  // resend timeout in seconds
  senderResendTimeout?: number;
  // response of remote ioSet
  rcResponseTimoutSec?: number;
  // default timeout for jobs in a queue
  queueJobTimeoutSec?: number;
  // delay before rebooting a host in seconds
  rebootDelaySec?: number;
  // allow or disallow to switch app into IoServer and back. Default is false
  //appSwitchLock?: boolean;

  // custom params
  //params?: {[index: string]: any};

  // network?: {
  //   routedMessageTTL: number;
  //   requestTimeout: number;
  // };
}


// raw host config specified in master config
export default interface PreHostConfig {
  // host unique id. 16 bytes
  id?: string;
  // platform?: Platforms;
  // machine?: string;

  plugins?: string[];

  //buildConfig?: BuildConfig;

  // specific config for each host
  config?: PreHostConfigConfig;

  // devices definitions by deviceId
  devices?: {[index: string]: any};
  // drivers definitions by driver name
  drivers?: {[index: string]: any};
  // services definitions by service id
  services?: {[index: string]: any};
  // params which will be passed to dev's configure method. By dev name
  ios?: IoDefinitions;

  //ioSet?: IoSetConfig;

  // override default props of devices by device class name
  devicesDefaults?: {[index: string]: {[index: string]: any}};

  // shortcut for automation service
  automation?: {[index: string]: any};
  // shortcut for logger service
  //consoleLogger?: {[index: string]: any};
  // shortcut for network service
  network?: {[index: string]: any};
  wsApi?: {[index: string]: any};
  httpApi?: {[index: string]: any};
  updater?: {[index: string]: any};
  ioServer?: {[index: string]: any};

  // additional npm packages which will be installed
  //dependencies?: {[index: string]: string};
}
