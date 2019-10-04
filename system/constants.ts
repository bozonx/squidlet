// timeout to start listening for servers such as http or websocket
export const SERVER_STARTING_TIMEOUT_SEC = 30;
// wait for response for http and so on
export const WAIT_RESPONSE_TIMEOUT_SEC = 60;

export enum SystemEvents {
  driversInitialized,
  servicesInitialized,
  devicesInitialized,
  appInitialized,
  beforeDestroy,
  logger,
}
