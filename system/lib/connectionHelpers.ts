import {ConnectionRequest, ConnectionResponse} from '../interfaces/Connection';


export function makeConnectionRequest(
  channel: number,
  data: Uint8Array
): ConnectionRequest {
  return {
    // TODO: make it
    requestId: 0,
    channel,
    data,
  };
}

export function encodeRequest(request: ConnectionRequest): Uint8Array {
  // TODO: add
  return new Uint8Array();
}

export function encodeResponse(response: ConnectionResponse): Uint8Array {
  // TODO: add
  return new Uint8Array();
}

export function decodeIncomeMessage(data: Uint8Array): ConnectionRequest | ConnectionResponse {
  // TODO: add
  return {} as ConnectionRequest;
}

// export function isRequest(request: ConnectionRequest): boolean {
//   // TODO: add
//   return true;
// }
