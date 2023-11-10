import Connection from '../../../../../squidlet/__old/system/interfaces/Connection';
import NetworkMessage from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/interfaces/NetworkMessage.js';
export type UriHandler = (request: NetworkMessage) => Promise<Uint8Array>;
export declare const NETWORK_PORT = 254;
export declare enum SPECIAL_URI {
    responseOk = 0,
    responseError = 1,
    getName = 2,
    ping = 3,
    pong = 4
}
export default class NetworkLogic {
    private readonly requestTimeoutSec;
    private readonly logError;
    private readonly router;
    private uriHandlers;
    constructor(peerConnections: Connection, myId: string, requestTimeoutSec: number, defaultTtl: number, logWarn: (msg: string) => void, logError: (msg: string) => void);
    init(): void;
    destroy(): void;
    /**
     * Send request and wait for response
     */
    request(toHostId: string, uri: string, payload: Uint8Array, TTL?: number): Promise<Uint8Array>;
    /**
     * Handle income requests. Only on handler of one uri is allowed.
     * @param uri
     * @param handler
     */
    startListenUri(uri: string, handler: UriHandler): void;
    stopListenUri(uri: string): void;
    /**
     * Handle request which is for current host
     */
    private handleIncomeMessage;
    private callUriHandlerAndSandBack;
    private waitForResponse;
    private processResponse;
}
