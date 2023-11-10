import DriverFactoryBase from '../../../base/DriverFactoryBase';
import DriverBase from '../../../base/DriverBase';
import { ConnectionParams } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import { WebSocketServerProps } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import { WsServerSessions } from '../../WsServerSessions/WsServerSessions';
export declare enum WS_SESSIONS_EVENTS {
    newSession = 0,
    sessionClose = 1,
    message = 2
}
export interface WsServerSessionsProps extends WebSocketServerProps {
    expiredSec: number;
}
export declare class WsServerSessions extends DriverBase<WsServerSessionsProps> {
    get listeningPromise(): Promise<void>;
    private readonly events;
    private get server();
    private sessionConnections;
    init: () => Promise<void>;
    destroy: () => Promise<void>;
    send(sessionId: string, data: string | Uint8Array): Promise<void>;
    /**
     * Close connection of session manually.
     */
    close(sessionId: string): Promise<void>;
    destroySession(sessionId: string): Promise<void>;
    onMessage(cb: (sessionId: string, data: string | Uint8Array) => void): number;
    /**
     * On created new session at handshake.
     * Connection isn't established at this moment!
     */
    onNewSession(cb: (sessionId: string, connectionParams: ConnectionParams) => void): number;
    onSessionClose(cb: (sessionId: string) => void): number;
    removeListener(handlerIndex: number): void;
    private handleNewConnection;
}
export default class Factory extends DriverFactoryBase<WsServerSessions, WsServerSessionsProps> {
    protected SubDriverClass: typeof import("./WsServerSessions").WsServerSessions;
    protected instanceId: (props: WsServerSessionsProps) => string;
}
