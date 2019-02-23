import Platforms from './Platforms';
import LogLevel from '../../host/interfaces/LogLevel';
import BuildConfig from './BuildConfig';


// raw host config specified in master config
export default interface PreHostConfig {
  // host unique id
  id?: string;
  platform?: Platforms;
  machine?: string;
  // default placement of various data dir specific for each platform
  defaultVarDataDir?: string;
  // default placement of various data dir specific for each platform
  defaultEnvSetDir?: string;

  plugins?: string[];

  buildConfig?: BuildConfig;

  // specific config for each host
  config?: {
    // path to host's various data dir. It can be absolute or relative of master config file
    dataDir?: string;
    logLevel?: LogLevel;
    // republish status silently every minute if it hasn't been changed
    defaultStatusRepublishIntervalMs?: number;
    // republish config silently every 10 minutes if it hasn't been changed
    defaultConfigRepublishIntervalMs?: number;
    // main timeout in seconds
    senderTimeout?: number;
    // resend timeout in seconds
    senderResendTimeout?: number;
    // custom params
    params?: {[index: string]: any};

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

  // override default props of devices by device class name
  devicesDefaults?: {[index: string]: any};

  // shortcut for automation service
  automation?: {[index: string]: any};
  // shortcut for mqtt service
  mqtt?: {[index: string]: any};
  // shortcut for logger service
  logger?: {[index: string]: any};
  // shortcut for webApi service
  webApi?: {[index: string]: any};
}
