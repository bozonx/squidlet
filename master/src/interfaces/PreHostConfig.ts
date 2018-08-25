import PreDeviceDefinition from './PreDeviceDefinition';
import PreDriverDefinition from './PreDriverDefinition';
import PreServiceDefinition from './PreServiceDefinition';
import Platforms from './Platforms';


// raw host config specified in master config
export default interface PreHostConfig {
  platform: Platforms;

  // specific config for each host
  host: {
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

  // override default params of devices
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
