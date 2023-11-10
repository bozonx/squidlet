import { NetworkRequest, NetworkResponse } from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
export declare enum COMMANDS {
    request = 254,
    response = 255
}
export declare enum MESSAGE_POSITION {
    command = 0,
    register = 1,
    requestIdStart = 2,
    requestIdEnd = 3,
    responseStatus = 4
}
export declare const REQUEST_PAYLOAD_START = 4;
export declare const RESPONSE_PAYLOAD_START = 6;
/**
 * Generate unique request id which is from 0 to 65535.
 * It increments a counter on each call.
 * Counter is initialized with a random value.
 */
export declare function makeRequestId(): number;
export declare function serializeRequest(register: number, request: NetworkRequest): Uint8Array;
export declare function deserializeRequest(data: Uint8Array): NetworkRequest;
export declare function serializeResponse(register: number, response: NetworkResponse): Uint8Array;
export declare function deserializeResponse(data: Uint8Array): NetworkResponse;
