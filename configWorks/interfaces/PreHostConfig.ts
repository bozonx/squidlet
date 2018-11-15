import PreDeviceDefinition from './PreDeviceDefinition';
import PreDriverDefinition from './PreDriverDefinition';
import PreServiceDefinition from './PreServiceDefinition';
import Platforms from './Platforms';
import LogLevel from '../../host/src/app/interfaces/LogLevel';


// raw host config specified in master config
export default interface PreHostConfig {
  platform?: Platforms;

  // specific config for each host
  config: {
    // path to dir where will be placed storage of host. It can be absolute or relative of master config file
    storageDir?: string;
    logLevel: LogLevel;
    // republish status silently every minute if it hasn't been changed
    defaultStatusRepublishIntervalMs?: number;
    // republish config silently every 10 minutes if it hasn't been changed
    defaultConfigRepublishIntervalMs?: number;
    // custom params
    params?: {[index: string]: any};
  };

  // devices definitions by deviceId
  devices?: {[index: string]: PreDeviceDefinition};
  // drivers definitions by driver name
  drivers?: {[index: string]: PreDriverDefinition};
  // services definitions by service id
  services?: {[index: string]: PreServiceDefinition};

  // override default props of devices by device class name
  devicesDefaults?: {[index: string]: any};

  // shortcut for automation service
  automation?: PreServiceDefinition;
  // shortcut for mqtt service
  mqtt?: PreServiceDefinition;
  // shortcut for logger service
  logger?: PreServiceDefinition;
  // shortcut for webApi service
  webApi?: PreServiceDefinition;
}
