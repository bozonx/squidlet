import {NETWORK_MESSAGE_TYPE} from '../../constants'

export function encodeNetworkPayload(
  fromHostId: string,
  toHostId: string,
  messageType: NETWORK_MESSAGE_TYPE,
  messageId: string,
  ttl: number,
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
