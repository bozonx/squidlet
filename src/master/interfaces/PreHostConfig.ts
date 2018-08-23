// raw host config specified in master config
export default interface PreHostConfig {
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
  devices?: {[index: string]: any};
  // drivers definitions by driver name
  drivers?: {[index: string]: any};
  // services definitions by service id
  services?: {[index: string]: any};

  // override default params of devices
  devicesDefaults?: {[index: string]: any};
}
