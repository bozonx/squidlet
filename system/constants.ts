// timeout to start listening for servers such as http or websocket
export const SERVER_STARTING_TIMEOUT_SEC = 30;
// wait for response for http and so on
export const WAIT_RESPONSE_TIMEOUT_SEC = 60;
// default status name of devices which can be omitted on status get or set
export const DEFAULT_DEVICE_STATUS = 'default';

export enum SystemEvents {
  driversInitialized,
  servicesInitialized,
  devicesInitialized,
  appInitialized,
  beforeDestroy,
  logger,
}
