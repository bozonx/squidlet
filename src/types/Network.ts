export interface NetworkMessageBase {
  fromHostId: string
  toHostId: string
  // hosts which request pass to get to destination host
  routeHosts: string[]
  category: string
  requestId: string
}

export interface NetworkIncomeRequest<T = any> extends NetworkMessageBase {
  payload?: T
}

export interface NetworkIncomeResponse<T = any> extends NetworkMessageBase, NetworkResponseStatus {
  payload?: T
}

export interface NetworkSendRequest
  extends Pick<NetworkMessageBase, 'toHostId' | 'category'>
{
  payload?: Record<string, any>
}

export interface NetworkSendResponse
  extends Pick<NetworkMessageBase, 'toHostId' | 'category' | 'requestId'>, NetworkResponseStatus
{
  payload?: Record<string, any>
}

export interface NetworkResponseStatus {
  code: number
  error?: string
}
