import WebSocketClientIo, { OnMessageHandler } from '../../../../../squidlet/__old/system/interfaces/io/WsClientIo';
export interface WsClientLogicProps {
    url: string;
    autoReconnect: boolean;
    reconnectTimeoutMs: number;
    maxTries: number;
    useCookie: boolean;
}
/**
 * Websocket client simplified interface.
 * It can automatically reconnect if "autoReconnect" param is true.
 * But if connection is closed by calling the close method you should create a new instance to reconnect.
 */
export default class WsClientLogic {
    get connectedPromise(): Promise<void>;
    private readonly messageEvents;
    private readonly wsClientIo;
    private readonly props;
    private readonly onClose;
    private readonly logDebug;
    private readonly logInfo;
    private readonly logError;
    private connectionId;
    private openPromise;
    private wasPrevOpenFulfilled;
    private connectionTries;
    private reconnectTimeout?;
    private isConnectionOpened;
    private cookies;
    private waitingCookies;
    private handlerIndexes;
    private get closedMsg();
    constructor(wsClientIo: WebSocketClientIo, props: WsClientLogicProps, onClose: () => void, logDebug: (message: string) => void, logInfo: (message: string) => void, logError: (message: string) => void);
    init(): Promise<void>;
    destroy(): Promise<void>;
    isConnected(): boolean;
    send(data: string | Uint8Array): Promise<void>;
    close(code: number, reason?: string): Promise<void>;
    onMessage(cb: OnMessageHandler): number;
    removeMessageListener(handlerId: number): void;
    private listen;
    private handleConnectionOpen;
    /**
     * Trying to reconnect on connection closed.
     */
    private handleConnectionClose;
    private handleMessage;
    /**
     * close connection and don't do reconnect if autoReconnect=false or no max tries or tries are exceeded
     * if tries more than -1(infinity) - increment it and close connection if can't connect
     * 0 means none
     */
    private resolveReconnection;
    private reconnect;
    private doReconnect;
    /**
     * You can't reconnect anymore after this. You should create a new instance if need.
     */
    private finallyCloseConnection;
    private makeOpenPromise;
    private destroyInstance;
    private setCookie;
    private isCookieMessage;
    private removeListeners;
}
