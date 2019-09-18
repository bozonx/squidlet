// 'verbose',
export const LENGTH_AND_START_ARR_DIFFERENCE = 1;
export const ASCII_NUMERIC_OFFSET = 48;
export const BYTES_IN_WORD = 2;
export const FUNCTION_NUMBER_LENGTH = 1;
export const BITS_IN_BYTE = 8;
export const ENCODE = 'utf8';
// timeout to start listening for servers such as http or websocket
export const SERVER_STARTING_TIMEOUT_SEC = 30;
// wait for response for http and so on
export const WAIT_RESPONSE_TIMEOUT_SEC = 60;

export const HANDLER_EVENT_POSITION = 0;
export const HANDLER_INDEX_POSITION = 1;

export enum AppLifeCycleEvents {
  devicesInitialized,
  appInitialized,
  beforeDestroy,
}
export const LOGGER_EVENT = 'LOGGER';
