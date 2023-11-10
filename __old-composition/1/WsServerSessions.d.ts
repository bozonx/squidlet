import DriverFactoryBase from '../../../../base/DriverFactoryBase';
import DriverBase from '../../../../base/DriverBase';
import { ConnectionParams } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import { WebSocketServerProps } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
export declare class WsServerSessions extends DriverBase<WebSocketServerProps> {
    get listeningPromise(): Promise<void>;
    private get wsServerIo();
    private server?;
    private get closedMsg();
    init: () => Promise<void>;
    destroy: () => Promise<void>;
    send: (connectionId: string, data: string | Uint8Array) => Promise<void>;
    /**
     * Force closing a connection
     */
    closeConnection(connectionId: string, code: number, reason: string): Promise<void>;
    destroyConnection(connectionId: string): Promise<void>;
    setCookie(connectionId: string, cookie: string): Promise<void>;
    onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): number;
    onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number;
    /**
     * Ordinary connection close.
     * It won't be called on destroy
     */
    onConnectionClose(cb: (connectionId: string) => void): number;
    removeListener(handlerIndex: number): void;
    private onServerClosed;
}
export default class Factory extends DriverFactoryBase<WsServerSessions, WebSocketServerProps> {
    protected SubDriverClass: typeof WsServerSessions;
    protected instanceId: (props: WebSocketServerProps) => string;
}
