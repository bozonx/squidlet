
export function encodeNetworkPayload(
  toHostId: string,
  fromHostId: string,
  uri: string,
  payload: Uint8Array,
  ttl: number
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
