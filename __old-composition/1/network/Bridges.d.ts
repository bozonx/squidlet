import { NetworkStatus } from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/interfaces/BridgeDriver.js';
export interface ConnectionMessage {
    port: number;
    payload: Uint8Array;
}
export interface ConnectionProps {
    address: number;
}
export interface NetworkRequest {
    requestId: number;
    body: Uint8Array;
}
export interface NetworkResponse {
    requestId: number;
    status: NetworkStatus;
    body?: Uint8Array;
    error?: string;
}
export declare enum NetworkStatus {
    ok = 0,
    errorMessage = 1
}
