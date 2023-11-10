import { NetworkRequest, NetworkResponse } from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
import { concatUint8Arr, numToUint8Word, uint8ToNum } from '../../../../squidlet-lib/src/binaryHelpers';
export var COMMANDS;
(function (COMMANDS) {
    COMMANDS[COMMANDS["request"] = 254] = "request";
    COMMANDS[COMMANDS["response"] = 255] = "response";
})(COMMANDS || (COMMANDS = {}));
export var MESSAGE_POSITION;
(function (MESSAGE_POSITION) {
    MESSAGE_POSITION[MESSAGE_POSITION["command"] = 0] = "command";
    MESSAGE_POSITION[MESSAGE_POSITION["register"] = 1] = "register";
    MESSAGE_POSITION[MESSAGE_POSITION["requestIdStart"] = 2] = "requestIdStart";
    MESSAGE_POSITION[MESSAGE_POSITION["requestIdEnd"] = 3] = "requestIdEnd";
    MESSAGE_POSITION[MESSAGE_POSITION["responseStatus"] = 4] = "responseStatus";
})(MESSAGE_POSITION || (MESSAGE_POSITION = {}));
export const REQUEST_PAYLOAD_START = 4;
export const RESPONSE_PAYLOAD_START = 6;
let counter = 0;
// TODO: test by hard
/**
 * Generate unique request id which is from 0 to 65535.
 * It increments a counter on each call.
 * Counter is initialized with a random value.
 */
export function makeRequestId() {
    if (counter >= 65535) {
        counter = 0;
    }
    else {
        counter++;
    }
    return counter;
}
export function serializeRequest(register, request) {
    const requestIdUint = numToUint8Word(request.requestId);
    const metaData = new Uint8Array([
        COMMANDS.request,
        register,
        requestIdUint[0],
        requestIdUint[1]
    ]);
    return concatUint8Arr(metaData, request.body);
}
export function deserializeRequest(data) {
    // requestId is 16 bit int
    const requestId = uint8ToNum(data.slice(MESSAGE_POSITION.requestIdStart, MESSAGE_POSITION.requestIdEnd + 1));
    const body = data.slice(REQUEST_PAYLOAD_START);
    return {
        requestId,
        body,
    };
}
export function serializeResponse(register, response) {
    const requestIdUint = numToUint8Word(response.requestId);
    const metaData = new Uint8Array([
        COMMANDS.request,
        register,
        requestIdUint[0],
        requestIdUint[1],
        response.status,
    ]);
    // TODO: если статус 1 - то преобразовать body в error string
    return concatUint8Arr(metaData, response.body || new Uint8Array(0));
}
export function deserializeResponse(data) {
    // requestId is 16 bit int
    const requestId = uint8ToNum(data.slice(MESSAGE_POSITION.requestIdStart, MESSAGE_POSITION.requestIdEnd + 1));
    const status = data[MESSAGE_POSITION.responseStatus];
    const body = data.slice(RESPONSE_PAYLOAD_START);
    // TODO: если статус 1 - то преобразовать body в error string
    return {
        requestId,
        status,
        body,
    };
}
