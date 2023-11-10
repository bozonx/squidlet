import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
import Connection, { ConnectionServiceType, IncomeMessageHandler, PeerStatusHandler } from '../../../../../squidlet/__old/system/interfaces/Connection';
import { WebSocketServerProps } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
export default class WsServerConnection extends ServiceBase<WebSocketServerProps> implements Connection {
    serviceType: ConnectionServiceType;
    private events;
    private server;
    init: () => Promise<void>;
    /**
     * Send data to peer and don't wait for response.
     * Port is from 0 and up to 255.
     */
    send(peerId: string, port: number, payload: Uint8Array): Promise<void>;
    onIncomeMessage(cb: IncomeMessageHandler): number;
    onPeerConnect(cb: PeerStatusHandler): number;
    onPeerDisconnect(cb: PeerStatusHandler): number;
    /**
     * Remove listener of onIncomeData, onPeerConnect or onPeerDisconnect
     */
    removeListener(handlerIndex: number): void;
    private handleIncomeMessage;
}
