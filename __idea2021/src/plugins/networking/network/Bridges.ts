import {NetworkStatus} from '../interfaces/BridgeDriver'


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
