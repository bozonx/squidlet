import {NETWORK_ERROR_CODE} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/constants.js'

export function encodeNetworkMessage(
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
): [string, string, string, number, Uint8Array, string] {
  // TODO: validate message

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

export function encodeEventRegisterPayload(eventName: string, handlerId: string): Uint8Array {
  // TODO: add
}

export function decodeEventRegisterPayload(payload: Uint8Array): [string, string] {
  // TODO: add
}

export function encodeEventOffPayload(handlerId: string): Uint8Array {
  // TODO: add
}

export function decodeEventOffPayload(payload: Uint8Array): string {
  // TODO: add
}

export function encodeEventEmitPayload(
  eventName: string | number,
  ...params: any[]
): Uint8Array {
  // TODO: add
}

export function вуcodeEventEmitPayload(payload: Uint8Array): [string, any[]] {
  // TODO: add
}

