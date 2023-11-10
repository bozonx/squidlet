import IndexedEventEmitter from '../squidlet-lib/src/IndexedEventEmitter';
import Connection, { CONNECTION_SERVICE_TYPE, ConnectionsEvents, IncomeMessageHandler, PeerStatusHandler, } from '../../../../../squidlet/__old/system/interfaces/Connection';
import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
// export type IncomeMessageHandler = (peerId: string, port: number, payload: Uint8Array, connectionName: string) => void;
// export type PeerStatusHandler = (peerId: string, connectionName: string) => void;
/**
 * It sends and receives messages into direct connections.
 * It listens to all the connections.
 */
export default class PeerConnections extends ServiceBase {
    events = new IndexedEventEmitter();
    // connections by peers - {peerId: connectionName}
    activePeers = {};
    async init() {
        this.initConnections();
    }
    async destroy() {
        this.events.destroy();
        // TODO: на всех connections поидее нужно отписаться
    }
    /**
     * Send new message.
     * It resolves the connection to use.
     * @param peerId - hostId of the closest host which is directly
     *   wired to current host
     * @param port
     * @param payload
     */
    async send(peerId, port, payload) {
        const connectionName = this.activePeers[peerId];
        if (!connectionName) {
            throw new Error(`Peer "${peerId}" hasn't been connected`);
        }
        const connection = this.getConnection(connectionName);
        await connection.send(peerId, port, payload);
    }
    onIncomeMessage(cb) {
        return this.events.addListener(ConnectionsEvents.message, cb);
    }
    onPeerConnect(cb) {
        return this.events.addListener(ConnectionsEvents.connected, cb);
    }
    onPeerDisconnect(cb) {
        return this.events.addListener(ConnectionsEvents.disconnected, cb);
    }
    removeListener(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    /**
     * Get connectionName by peerId
     * @param peerId
     */
    resolveConnectionName(peerId) {
        // TODO: add
        return;
    }
    initConnections() {
        for (let serviceName of Object.keys(this.context.service)) {
            if (this.context.service[serviceName] !== CONNECTION_SERVICE_TYPE)
                continue;
            this.addConnectionListeners(serviceName, this.context.service[serviceName]);
        }
    }
    addConnectionListeners(connectionName, connection) {
        connection.onIncomeMessage((peerId, port, payload) => this.handleIncomeMessages(peerId, port, payload, connectionName));
        connection.onPeerConnect((peerId) => {
            this.activatePeer(peerId, connectionName);
        });
        connection.onPeerDisconnect((peerId) => {
            this.deactivatePeer(peerId, connectionName);
        });
    }
    /**
     * Handle requests which came out of connection and sand status back
     */
    handleIncomeMessages(peerId, port, payload, connectionName) {
        this.activatePeer(peerId, connectionName);
        this.events.emit(ConnectionsEvents.message, peerId, port, payload, connectionName);
    }
    getConnection(connectionName) {
        if (!this.context.service[connectionName]) {
            throw new Error(`Can't find connection "${connectionName}"`);
        }
        return this.context.service[connectionName];
    }
    activatePeer(peerId, connectionName) {
        if (this.activePeers[peerId] && this.activePeers[peerId] !== connectionName) {
            throw new Error(`Peer ${peerId} has different connection.` +
                ` Last is ${this.activePeers[peerId]}, new id ${connectionName}`);
        }
        const wasRegistered = Boolean(this.activePeers[peerId]);
        this.activePeers[peerId] = connectionName;
        if (!wasRegistered) {
            this.events.emit(ConnectionsEvents.connected, peerId, connectionName);
        }
    }
    deactivatePeer(peerId, connectionName) {
        if (!this.activePeers[peerId])
            return;
        delete this.activePeers[peerId];
        this.events.emit(ConnectionsEvents.disconnected, peerId, connectionName);
    }
}
