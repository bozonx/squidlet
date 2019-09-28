// timeout to start listening for servers such as http or websocket
export const SERVER_STARTING_TIMEOUT_SEC = 30;
// wait for response for http and so on
export const WAIT_RESPONSE_TIMEOUT_SEC = 60;

// TODO: remove - use enum
export const HANDLER_EVENT_POSITION = 0;
export const HANDLER_INDEX_POSITION = 1;

// TODO: make full system event enum
export enum AppLifeCycleEvents {
  devicesInitialized,
  appInitialized,
  beforeDestroy,
}
export const LOGGER_EVENT = 'LOGGER';
