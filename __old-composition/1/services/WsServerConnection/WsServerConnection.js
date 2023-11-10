import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
import Connection, { CONNECTION_SERVICE_TYPE, ConnectionServiceType, ConnectionsEvents, IncomeMessageHandler, PeerStatusHandler } from '../../../../../squidlet/__old/system/interfaces/Connection';
import IndexedEventEmitter from '../squidlet-lib/src/IndexedEventEmitter';
import { ConnectionParams, WebSocketServerProps } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import { WsServer } from '../../../../../squidlet-networking/src/drivers/WsServer/WsServer';
export default class WsServerConnection extends ServiceBase {
    serviceType = CONNECTION_SERVICE_TYPE;
    events = new IndexedEventEmitter();
    server;
    init = async () => {
        // it creates a new server on specified host:port
        this.server = await this.context.getSubDriver('WsServer', this.props);
        this.server.onMessage(this.handleIncomeMessage);
        this.server.onConnection((connectionId, connectionParams) => {
            this.events.emit(ConnectionsEvents.connected, connectionId);
        });
        this.server.onConnectionClose((connectionId) => {
            this.events.emit(ConnectionsEvents.disconnected, connectionId);
        });
    };
    /**
     * Send data to peer and don't wait for response.
     * Port is from 0 and up to 255.
     */
    async send(peerId, port, payload) {
        await this.server.send(peerId, new Uint8Array([port, ...payload]));
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
    /**
     * Remove listener of onIncomeData, onPeerConnect or onPeerDisconnect
     */
    removeListener(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    handleIncomeMessage = (connectionId, data) => {
        if (!(data instanceof Uint8Array) || !data.length)
            return;
        const [port, ...rest] = data;
        const payload = new Uint8Array(rest);
        // peerId is actually connectionId
        this.events.emit(ConnectionsEvents.message, connectionId, port, payload);
    };
}
