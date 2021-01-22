import {NETWORK_ERROR_CODE, NETWORK_MESSAGE_TYPE} from '../../constants'

export function encodeNetworkPayload(
  fromHostId: string,
  toHostId: string,
  messageId: string,
  initialTtl: number,
  payload?: Uint8Array,
  uri?: string
): Uint8Array {
  // TODO: add
}

export function decodeNetworkMessage(
  data: Uint8Array
): [string, string, string, number, string, Uint8Array] {
  // TODO: validate message

}

export function validatePayload(payload: Uint8Array) {
  // TODO: add
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
