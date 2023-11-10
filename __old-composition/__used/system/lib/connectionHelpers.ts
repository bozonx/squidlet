import {ConnectionRequest, ConnectionResponse, ConnectionStatus} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/Connection.js';


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

export function isRequest(request: ConnectionRequest | ConnectionResponse): boolean {
  return request.status === ConnectionStatus.request;
}

export function isConnectionMessage(data: Uint8Array): boolean {
  // TODO: проверить заголовок чтобы определить что это комманда для connection

}
