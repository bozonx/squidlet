export interface NetworkMessageBase {
  fromHostId: string
  toHostId: string
  // hosts which request pass to get to destination host
  routeHosts: string[]
  category: string
  requestId: string
}

// export interface NetworkSerializedMessage extends NetworkMessageBase {
//   payload: Uint8Array
// }

export interface NetworkIncomeRequest extends NetworkMessageBase {
  payload: Record<string, any>
}

export interface NetworkIncomeResponse<T> extends NetworkMessageBase, NetworkResponseStatus {
  payload: T
}

export interface NetworkSendRequest
  extends Pick<NetworkMessageBase, 'toHostId' | 'category'>
{
  payload: Record<string, any>
}

export interface NetworkSendResponse
  extends Pick<NetworkMessageBase, 'toHostId' | 'category' | 'requestId'>
{
  payload: Record<string, any>
}

export interface NetworkResponseStatus {
  code: number
  error?: string
}
