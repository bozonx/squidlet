import {IoItemDefinition} from '../../system/interfaces/IoItem';


// export interface IoSetConfig {
//   type: IoSetTypes;
//   // other io set params
//   [index: string]: any;
// }

export interface PreHostConfigConfig {
  //logLevel?: LogLevel;
  // republish status silently every minute if it hasn't been changed
  //defaultStatusRepublishIntervalMs?: number;
  // republish config silently every 10 minutes if it hasn't been changed
  //defaultConfigRepublishIntervalMs?: number;
  // main timeout in seconds
  senderTimeout?: number;
  // resend timeout in seconds
  senderResendTimeout?: number;
  // response of remote ioSet
  rcResponseTimoutSec?: number;
  // default timeout for jobs in RequestQueue
  queueJobTimeoutSec?: number;

  // custom params
  //params?: {[index: string]: any};

  // network?: {
  //   routedMessageTTL: number;
  //   requestTimeout: number;
  // };
}


// raw host config specified in master config
export default interface PreHostConfig {
  // host unique id
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
  ios?: IoItemDefinition;

  //ioSet?: IoSetConfig;

  // override default props of devices by device class name
  devicesDefaults?: {[index: string]: {[index: string]: any}};

  // shortcut for automation service
  automation?: {[index: string]: any};
  // shortcut for logger service
  consoleLogger?: {[index: string]: any};
  // shortcut for mqttApi service
  mqttApi?: {[index: string]: any};
  wsApi?: {[index: string]: any};
  httpApi?: {[index: string]: any};

  // additional npm packages which will be installed
  dependencies?: {[index: string]: string};

  // host and port to listen to in IO server mode.
  // it will use default values if this param is an empty object.
  ioServer?: {
    // default is localhost
    host?: string;
    // default is 8089
    port?: number;
  };

}
