import { asciiToUint8Array, uint8ArrayToAscii } from '../squidlet-lib/src/serialize';
import { callSafely } from '../squidlet-lib/src/common';
import Promised from '../squidlet-lib/src/Promised';
import Connection from '../../../../../squidlet/__old/system/interfaces/Connection';
import NetworkMessage from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/interfaces/NetworkMessage.js';
import Router from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/Router.js';
// port of connection which network uses to send and receive messages
export const NETWORK_PORT = 254;
export var SPECIAL_URI;
(function (SPECIAL_URI) {
    SPECIAL_URI[SPECIAL_URI["responseOk"] = 0] = "responseOk";
    SPECIAL_URI[SPECIAL_URI["responseError"] = 1] = "responseError";
    SPECIAL_URI[SPECIAL_URI["getName"] = 2] = "getName";
    SPECIAL_URI[SPECIAL_URI["ping"] = 3] = "ping";
    SPECIAL_URI[SPECIAL_URI["pong"] = 4] = "pong";
})(SPECIAL_URI || (SPECIAL_URI = {}));
export default class NetworkLogic {
    requestTimeoutSec;
    logError;
    router;
    uriHandlers = {};
    constructor(peerConnections, myId, requestTimeoutSec, defaultTtl, logWarn, logError) {
        this.requestTimeoutSec = requestTimeoutSec;
        this.logError = logError;
        this.router = new Router(peerConnections, myId, defaultTtl, logWarn, logError);
    }
    init() {
        this.router.init();
        this.router.onIncomeMessage(this.handleIncomeMessage);
    }
    destroy() {
        this.router.destroy();
        delete this.uriHandlers;
    }
    /**
     * Send request and wait for response
     */
    async request(toHostId, uri, payload, TTL) {
        if (uri.length <= 1) {
            throw new Error(`Uri has to have length greater than 1. One byte is for status number`);
        }
        const messageId = this.router.newMessageId();
        // send request and wait while it is finished
        await this.router.send(toHostId, uri, payload, messageId, TTL);
        return this.waitForResponse(uri, messageId);
    }
    /**
     * Handle income requests. Only on handler of one uri is allowed.
     * @param uri
     * @param handler
     */
    startListenUri(uri, handler) {
        if (this.uriHandlers[uri]) {
            throw new Error(`Handler of uri has already defined`);
        }
        this.uriHandlers[uri] = handler;
    }
    stopListenUri(uri) {
        delete this.uriHandlers[uri];
    }
    /**
     * Handle request which is for current host
     */
    handleIncomeMessage(incomeMessage) {
        // listen only requests. They have uri with length greater than 1
        if (incomeMessage.uri.length <= 1)
            return;
        // if no handler - then send an error back
        if (!this.uriHandlers[incomeMessage.uri]) {
            this.router.send(incomeMessage.completeRoute[0], String(SPECIAL_URI.responseError), asciiToUint8Array(`No handler on uri "${incomeMessage.uri}"`), incomeMessage.messageId)
                .catch(this.logError);
            return;
        }
        // call handler and send response but don't wait for result
        this.callUriHandlerAndSandBack(incomeMessage)
            .catch(this.logError);
    }
    async callUriHandlerAndSandBack(incomeMessage) {
        let backUri = String(SPECIAL_URI.responseOk);
        let payloadToSendBack;
        try {
            payloadToSendBack = await callSafely(this.uriHandlers[incomeMessage.uri], incomeMessage);
        }
        catch (e) {
            backUri = String(SPECIAL_URI.responseError);
            payloadToSendBack = asciiToUint8Array(`Error while executing handler of uri "${incomeMessage.uri}" :${e}`);
        }
        // send back data which handler returned or error
        await this.router.send(incomeMessage.completeRoute[0], backUri, payloadToSendBack, incomeMessage.messageId);
    }
    waitForResponse(uri, messageId) {
        const promised = new Promised();
        let timeout;
        const responseListener = this.router.onIncomeMessage((incomeMessage) => {
            // listen only ours response
            if (incomeMessage.messageId !== messageId)
                return;
            this.router.removeListener(responseListener);
            clearTimeout(timeout);
            this.processResponse(incomeMessage)
                .then(promised.resolve)
                .catch(promised.reject);
        });
        timeout = setTimeout(() => {
            this.router.removeListener(responseListener);
            if (promised.isFulfilled())
                return;
            promised.reject(new Error(`Timeout of request has been exceeded of URI "${uri}"`));
        }, this.requestTimeoutSec * 1000);
        return promised.promise;
    }
    async processResponse(incomeMessage) {
        switch (incomeMessage.uri) {
            case String(SPECIAL_URI.responseOk):
                // it's OK
                return incomeMessage.payload;
            case String(SPECIAL_URI.responseError):
                // if an error has been returned just convert it to string and reject promise
                throw new Error(uint8ArrayToAscii(incomeMessage.payload));
            default:
                throw new Error(`Unknown response URI "${incomeMessage.uri}"`);
        }
    }
}
