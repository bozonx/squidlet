import {NetworkRequest, NetworkResponse} from '../interfaces/NetworkDriver';
import {concatUint8Arr, numToUint8Word} from './binaryHelpers';


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


// TODO: test by hard


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

  return concatUint8Arr(metaData, response.body);
}

export function deserializeResponse(data: Uint8Array): NetworkResponse {

}
