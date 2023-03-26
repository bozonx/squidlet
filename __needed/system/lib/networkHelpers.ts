import {NetworkRequest, NetworkResponse} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
import {concatUint8Arr, numToUint8Word, uint8ToNum} from '../../../../squidlet-lib/src/binaryHelpers';


export enum COMMANDS {
  request = 254,
  response,
}

export enum MESSAGE_POSITION {
  command,
  register,
  requestIdStart,
  requestIdEnd,
  responseStatus,
}

export const REQUEST_PAYLOAD_START = 4;
export const RESPONSE_PAYLOAD_START = 6;
let counter: number = 0;


// TODO: test by hard

/**
 * Generate unique request id which is from 0 to 65535.
 * It increments a counter on each call.
 * Counter is initialized with a random value.
 */
export function makeRequestId(): number {
  if (counter >= 65535) {
    counter = 0;
  }
  else {
    counter++;
  }

  return counter;
}

export function serializeRequest(register: number, request: NetworkRequest): Uint8Array {
  const requestIdUint: Uint8Array = numToUint8Word(request.requestId);
  const metaData: Uint8Array = new Uint8Array([
    COMMANDS.request,
    register,
    requestIdUint[0],
    requestIdUint[1]
  ]);

  return concatUint8Arr(metaData, request.body);
}

export function deserializeRequest(data: Uint8Array): NetworkRequest {
  // requestId is 16 bit int
  const requestId: number = uint8ToNum(
    data.slice(MESSAGE_POSITION.requestIdStart, MESSAGE_POSITION.requestIdEnd + 1)
  );
  const body: Uint8Array = data.slice(REQUEST_PAYLOAD_START);

  return {
    requestId,
    body,
  };
}

export function serializeResponse(register: number, response: NetworkResponse): Uint8Array {
  const requestIdUint: Uint8Array = numToUint8Word(response.requestId);
  const metaData: Uint8Array = new Uint8Array([
    COMMANDS.request,
    register,
    requestIdUint[0],
    requestIdUint[1],
    response.status,
  ]);

  // TODO: если статус 1 - то преобразовать body в error string

  return concatUint8Arr(metaData, response.body || new Uint8Array(0));
}

export function deserializeResponse(data: Uint8Array): NetworkResponse {
  // requestId is 16 bit int
  const requestId: number = uint8ToNum(
    data.slice(MESSAGE_POSITION.requestIdStart, MESSAGE_POSITION.requestIdEnd + 1)
  );
  const status: number = data[MESSAGE_POSITION.responseStatus];
  const body: Uint8Array = data.slice(RESPONSE_PAYLOAD_START);

  // TODO: если статус 1 - то преобразовать body в error string

  return {
    requestId,
    status,
    body,
  };
}
