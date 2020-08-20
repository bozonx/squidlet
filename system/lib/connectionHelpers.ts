import {ConnectionRequest} from '../interfaces/Connection';


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

export function makeConnectionRequestMessage(request: ConnectionRequest): Uint8Array {
  // TODO: add
  return new Uint8Array();
}
