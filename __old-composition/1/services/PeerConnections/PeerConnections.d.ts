import Connection, { IncomeMessageHandler, PeerStatusHandler } from '../../../../../squidlet/__old/system/interfaces/Connection';
import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
/**
 * It sends and receives messages into direct connections.
 * It listens to all the connections.
 */
export default class PeerConnections extends ServiceBase implements Connection {
    private events;
    private activePeers;
    init(): Promise<void>;
    destroy(): Promise<void>;
    /**
     * Send new message.
     * It resolves the connection to use.
     * @param peerId - hostId of the closest host which is directly
     *   wired to current host
     * @param port
     * @param payload
     */
    send(peerId: string, port: number, payload: Uint8Array): Promise<void>;
    onIncomeMessage(cb: IncomeMessageHandler): number;
    onPeerConnect(cb: PeerStatusHandler): number;
    onPeerDisconnect(cb: PeerStatusHandler): number;
    removeListener(handlerIndex: number): void;
    /**
     * Get connectionName by peerId
     * @param peerId
     */
    resolveConnectionName(peerId: string): string | undefined;
    private initConnections;
    private addConnectionListeners;
    /**
     * Handle requests which came out of connection and sand status back
     */
    private handleIncomeMessages;
    private getConnection;
    private activatePeer;
    private deactivatePeer;
}
