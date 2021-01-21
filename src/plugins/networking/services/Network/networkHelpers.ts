import {NETWORK_ERROR_TYPE, NETWORK_MESSAGE_TYPE} from '../../constants'

export function encodeNetworkPayload(
  fromHostId: string,
  toHostId: string,
  messageId: string,
  initialTtl: number,
  uri?: string,
  payload?: Uint8Array
): Uint8Array {
  // TODO: add
}

export function decodeNetworkMessage(
  data: Uint8Array
): [string, string, string, string, Uint8Array] {
  // TODO: validate message

}

export function extractToHostIdFromPayload(data: Uint8Array): string {

}

export function encodeErrorPayload(
  errorType: NETWORK_ERROR_TYPE,
  message?: string
): Uint8Array {
  // TODO: add
}

export function decodeErrorPayload(payload: Uint8Array): [NETWORK_ERROR_TYPE, string] {
  // TODO: add
}
