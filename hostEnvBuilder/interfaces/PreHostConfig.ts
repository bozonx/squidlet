import Platforms from './Platforms';
import {IoItemDefinition} from '../../system/interfaces/IoItem';


// export interface IoSetConfig {
//   type: IoSetTypes;
//   // other io set params
//   [index: string]: any;
// }


// raw host config specified in master config
export default interface PreHostConfig {
  // host unique id
  id?: string;
  platform?: Platforms;
  machine?: string;

  plugins?: string[];

  //buildConfig?: BuildConfig;

  // specific config for each host
  config?: {
    //logLevel?: LogLevel;
    // republish status silently every minute if it hasn't been changed
    defaultStatusRepublishIntervalMs?: number;
    // republish config silently every 10 minutes if it hasn't been changed
    defaultConfigRepublishIntervalMs?: number;
    // main timeout in seconds
    senderTimeout?: number;
    // resend timeout in seconds
    senderResendTimeout?: number;
    // response of remote ioSet
    ioSetResponseTimoutSec?: number;

    // custom params
    //params?: {[index: string]: any};

    // network?: {
    //   routedMessageTTL: number;
    //   requestTimeout: number;
    // };
  };

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
  // shortcut for mqtt service
  mqtt?: {[index: string]: any};
  backdoor?: {[index: string]: any};

  // additional npm packages which will be installed
  dependencies?: {[index: string]: string};
}
