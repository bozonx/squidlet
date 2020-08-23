// timeout to start listening for servers such as http or websocket
export const SERVER_STARTING_TIMEOUT_SEC = 30;
// wait for response for http and so on
export const WAIT_RESPONSE_TIMEOUT_SEC = 60;
export const APP_DESTROY_TIMEOUT_SEC = 60;
// default status name of devices which can be omitted on status get or set
export const DEFAULT_DEVICE_STATUS = 'default';
// should start IO server on app start
export const START_APP_TYPE_FILE_NAME = 'startAppType';
export const METHOD_DELIMITER = '.';
export const MAX_NUM_16_BIT = 65536;


export enum SystemEvents {
  driversInitialized,
  servicesInitialized,
  devicesInitialized,
  appInitialized,
  beforeDestroy,
  logger,
}
