import {NETWORK_ERROR_CODE, NETWORK_MESSAGE_TYPE} from '../../constants'

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
  errorType: NETWORK_ERROR_CODE,
  message?: string
): Uint8Array {
  // TODO: add
}

export function decodeErrorPayload(payload: Uint8Array): [NETWORK_ERROR_CODE, string] {
  // TODO: add
}

export function extractMessageId(payload: Uint8Array): string | undefined {
  // TODO: add
}
