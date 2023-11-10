import {NetworkStatus} from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/interfaces/BridgeDriver.js'


export interface ConnectionMessage {
  port: number;
  payload: Uint8Array;
}

export interface ConnectionProps {
  address: number;
}


export interface NetworkRequest {
  // should be 16 bits
  requestId: number;
  body: Uint8Array;
}

export interface NetworkResponse {
  requestId: number;
  status: NetworkStatus;
  body?: Uint8Array;
  error?: string;
}


export enum NetworkStatus {
  ok = 0,
  // body contains an error string
  errorMessage,
}
