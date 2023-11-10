import DriverBase from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import NetworkDriver, { IncomeRequestHandler, IncomeResponseHandler, NetworkRequest, NetworkResponse, NetworkStatus } from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
import IndexedEventEmitter from '../../../../../squidlet-lib/src/IndexedEventEmitter';
import { COMMANDS, deserializeRequest, deserializeResponse, makeRequestId, MESSAGE_POSITION, REQUEST_PAYLOAD_START, serializeRequest, serializeResponse } from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/networkHelpers.js';
import Promised from '../../../../../squidlet-lib/src/Promised';
import { hexNumToString, stringToUint8Array } from '../../../../../squidlet-lib/src/binaryHelpers';
var EVENTS;
(function (EVENTS) {
    EVENTS[EVENTS["request"] = 0] = "request";
    EVENTS[EVENTS["response"] = 1] = "response";
})(EVENTS || (EVENTS = {}));
export default class NetworkDriverBase extends DriverBase {
    events = new IndexedEventEmitter();
    async request(port, body) {
        const promised = new Promised();
        const requestId = makeRequestId();
        const request = { requestId, body };
        let timeout;
        this.sendRequest(port, request)
            .catch((e) => {
            clearTimeout(timeout);
            !promised.isFulfilled() && promised.reject(e);
        });
        // listen for response
        const listenIndex = this.onIncomeResponse(port, (response) => {
            // do nothing if filed or resolved. process only ours request
            if (promised.isFulfilled() || response.requestId !== requestId)
                return;
            this.removeListener(listenIndex);
            clearTimeout(timeout);
            promised.resolve(response);
        });
        timeout = setTimeout(() => {
            if (promised.isFulfilled())
                return;
            this.removeListener(listenIndex);
            promised.reject(new Error(`SerialNetwork.request: Timeout of request has been exceeded of port "${port}"`));
        }, this.config.config.requestTimeoutSec * 1000);
        return promised.promise;
    }
    onRequest(port, handler) {
        const wrapper = (request) => {
            handler(request)
                .then((response) => {
                // send response and don't wait for result
                this.sendResponse(port, response)
                    .catch(this.log.error);
            })
                .catch((e) => {
                const response = {
                    requestId: request.requestId,
                    status: NetworkStatus.errorMessage,
                    body: new Uint8Array(stringToUint8Array(String(e))),
                };
                this.sendResponse(port, response)
                    .catch(this.log.error);
            });
        };
        const eventName = `${EVENTS.request}${hexNumToString(port)}`;
        return this.events.addListener(eventName, wrapper);
    }
    removeListener(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    onIncomeResponse(register, handler) {
        const eventName = `${EVENTS.response}${hexNumToString(register)}`;
        return this.events.addListener(eventName, handler);
    }
    sendRequest(register, request) {
        const data = serializeRequest(register, request);
        return this.write(data);
    }
    sendResponse(register, response) {
        const data = serializeResponse(register, response);
        return this.write(data);
    }
    /**
     * Handle income message and deserialize it.
     * @param data
     */
    incomeMessage(data) {
        if (!data.length || ![COMMANDS.request, COMMANDS.response].includes(data[MESSAGE_POSITION.command])) {
            // skip not ours commands or empty data
            return;
        }
        else if (data.length < REQUEST_PAYLOAD_START) {
            throw new Error(`NetworkDriverBase.incomeMessage: incorrect data length: ${data.length}`);
        }
        const register = data[MESSAGE_POSITION.register];
        if (data[MESSAGE_POSITION.command] === COMMANDS.request) {
            const request = deserializeRequest(data);
            const eventName = this.makeEventName(EVENTS.request, register);
            this.events.emit(eventName, request);
        }
        else {
            // response
            const response = deserializeResponse(data);
            const eventName = this.makeEventName(EVENTS.response, register);
            this.events.emit(eventName, response);
        }
    }
    makeEventName(eventName, register) {
        return `${EVENTS.request}${hexNumToString(register)}`;
    }
}
